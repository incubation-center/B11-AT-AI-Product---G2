import json
import logging
import re
import tempfile
import zipfile
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Any, Optional
from urllib.parse import quote, urlparse

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.datasets import Dataset
from app.models.defects import Defect

logger = logging.getLogger(__name__)


GITHUB_HTTPS_RE = re.compile(
    r"^https://github\.com/(?P<owner>[^/]+)/(?P<repo>[^/]+?)(?:\.git)?$",
    re.IGNORECASE,
)


TEST_PATH_HINTS = [
    "test",
    "__tests__",
    "tests",
    "spec",
    "cypress",
    "playwright",
    "jest",
    "robot",
    "behave",
    "bdd",
]

CODE_EXTS = {
    ".py",
    ".js",
    ".ts",
    ".tsx",
    ".java",
    ".go",
    ".rb",
    ".php",
    ".cs",
    ".cpp",
    ".c",
    ".h",
    ".hpp",
    ".kt",
    ".swift",
    ".scala",
}


@dataclass(frozen=True)
class RepoRef:
    owner: str
    repo: str
    default_branch: str


def _validate_and_parse_github_url(clone_url: str) -> tuple[str, str]:
    """Validate we only accept GitHub HTTPS repo URLs."""
    clone_url = (clone_url or "").strip()
    m = GITHUB_HTTPS_RE.match(clone_url)
    if not m:
        raise ValueError("clone_url must be a GitHub HTTPS repository URL")
    owner = m.group("owner")
    repo = m.group("repo")
    return owner, repo


async def _get_repo_default_branch(client: httpx.AsyncClient, owner: str, repo: str) -> str:
    resp = await client.get(f"https://api.github.com/repos/{owner}/{repo}")
    if resp.status_code != 200:
        raise ValueError(f"Failed to resolve GitHub repo info (status {resp.status_code})")
    data = resp.json()
    default_branch = data.get("default_branch")
    if not default_branch:
        raise ValueError("GitHub repo default branch not found")
    return str(default_branch)


async def _download_repo_zip(client: httpx.AsyncClient, owner: str, repo: str, branch: str) -> bytes:
    """
    Download a repository zip for a branch.

    GitHub expects the branch ref in the path. If the branch name contains '/',
    we must NOT encode the slashes, otherwise GitHub may return a non-zip response.
    """
    branch_path = quote(branch, safe="/")

    # Primary: GitHub archive endpoint
    url1 = f"https://github.com/{owner}/{repo}/archive/refs/heads/{branch_path}.zip"
    resp1 = await client.get(url1, follow_redirects=True)
    if resp1.status_code == 200 and resp1.headers.get("content-type", "").lower().startswith("application/zip"):
        return resp1.content

    # Fallback: codeload endpoint (often more reliable for refs with slashes)
    url2 = f"https://codeload.github.com/{owner}/{repo}/zip/refs/heads/{branch_path}"
    resp2 = await client.get(url2, follow_redirects=True)
    if resp2.status_code != 200:
        sample = (resp2.text or "")[:200].replace("\n", " ")
        raise ValueError(f"Failed to download repo archive (status {resp2.status_code}). Response: {sample}")
    return resp2.content


def _is_within_base_path(base_dir: Path, target_path: Path) -> bool:
    try:
        target_path.resolve().relative_to(base_dir.resolve())
        return True
    except Exception:
        return False


def _safe_extract_zip(zip_bytes: bytes, extract_dir: Path) -> None:
    with zipfile.ZipFile(BytesIO(zip_bytes)) as zf:
        for member in zf.infolist():
            # Skip directories.
            if member.filename.endswith("/"):
                continue

            # zip slip protection.
            member_path = Path(member.filename)
            dest = extract_dir / member_path
            if not _is_within_base_path(extract_dir, dest):
                raise ValueError("Unsafe zip content detected")

        # Second pass: actually extract after validation.
        zf.extractall(extract_dir)


def _should_include_file(rel_path: str) -> bool:
    lower = rel_path.lower()
    # Strong hints first
    if any(hint.lower() in lower for hint in TEST_PATH_HINTS):
        return True
    return any(lower.endswith(ext) for ext in CODE_EXTS)


def _pick_repo_files(root_dir: Path, max_files: int) -> list[Path]:
    """
    Pick a limited set of files to feed into the LLM.
    We prefer "test-ish" paths first, then fall back to source files.
    """
    candidates: list[Path] = []
    for p in root_dir.rglob("*"):
        if not p.is_file():
            continue
        rel = str(p.relative_to(root_dir)).replace("\\", "/")
        if not _should_include_file(rel):
            continue
        # Keep only known code types or explicitly test folders.
        if not any(rel.lower().endswith(ext) for ext in CODE_EXTS):
            # Allow test-ish files without code extension but still keep it limited.
            if not any(h.lower() in rel.lower() for h in TEST_PATH_HINTS):
                continue
        candidates.append(p)

    # Sort: prefer paths containing test hints.
    def score(path: Path) -> int:
        rel = str(path.relative_to(root_dir)).lower()
        return sum(10 for hint in TEST_PATH_HINTS if hint.lower() in rel)

    candidates.sort(key=lambda p: score(p), reverse=True)
    return candidates[:max_files]


def _read_text_limited(path: Path, max_bytes: int = 200_000) -> str:
    data = path.read_bytes()
    if len(data) > max_bytes:
        data = data[:max_bytes]
    # Be resilient to weird encodings.
    return data.decode("utf-8", errors="ignore")


def _extract_json_array(text: str) -> list[Any]:
    """Try to extract a JSON array from arbitrary model output."""
    text = text.strip()
    # Fast path: direct parse.
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
    except Exception:
        pass

    # Fallback: find first '[' and last ']' and parse the substring.
    start = text.find("[")
    end = text.rfind("]")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("Model output did not contain a JSON array")
    candidate = text[start : end + 1]
    parsed = json.loads(candidate)
    if not isinstance(parsed, list):
        raise ValueError("Extracted JSON was not an array")
    return parsed


def _build_generation_prompt(repo_owner: str, repo_name: str, files: list[tuple[str, str]], max_defects: int) -> str:
    file_blocks = []
    for rel_path, content in files:
        # Keep prompt compact by truncating each file content.
        # Content is already limited by _read_text_limited, but we also add a safety cap.
        cap = 20_000
        truncated = content[:cap]
        file_blocks.append(f"--- FILE: {rel_path} ---\n{truncated}\n--- END FILE ---")

    files_text = "\n\n".join(file_blocks)
    return (
        "You are a QA engineering assistant specializing in test case documentation.\n"
        "Task: Analyze source code and test files from a GitHub repository and generate professional QA test cases.\n"
        "Output must be ONLY valid JSON (no markdown, no explanation).\n\n"
        f"Repository: {repo_owner}/{repo_name}\n"
        f"Generate at most {max_defects} test cases.\n\n"
        "Each JSON object MUST have these keys (proper QA test case format):\n"
        "- title (string, required): Brief name of the test case (e.g., 'Verify user login with valid credentials')\n"
        "- module (string|null): Software component/feature being tested\n"
        "- severity (string|null): one of Critical, High, Medium, Low\n"
        "- priority (string|null): one of P1, P2, P3, P4\n"
        "- environment (string|null): Where test runs (e.g., staging, production)\n"
        "- status (string|null): Test status (e.g., Open, Automated)\n"
        "- preconditions (string|null): Setup needed before test (e.g., 'User must be logged out', 'DB must be reset')\n"
        "- test_steps (string|null): Step-by-step instructions (numbered, clear actions). Example: '1. Open login page\\n2. Enter username\\n3. Click Submit'\n"
        "- expected_result (string|null): What should happen after each step (e.g., 'User logged in successfully', 'Redirect to home page')\n"
        "- bug_id (string|null): Reference ID if applicable\n\n"
        "IMPORTANT RULES FOR QA DOCUMENTATION:\n"
        "- title MUST be action-oriented and describe what is being tested (NOT developer notes)\n"
        "- test_steps MUST be numbered, detailed, and executable by QA without code knowledge\n"
        "- expected_result MUST describe observable outcomes (what user/tester should see)\n"
        "- preconditions MUST specify environment/data setup needed\n"
        "- Write in QA/tester language, NOT developer language\n"
        "- Each test case should be independent and focused on ONE feature\n"
        "- Return an array of objects.\n\n"
        "=== REPOSITORY FILES (TRUNCATED) ===\n"
        f"{files_text}\n"
        "=== END REPOSITORY FILES ==="
    )


async def _generate_testcases_with_llm(prompt: str) -> list[dict[str, Any]]:
    """
    Reuse the same OpenRouter client style as embedding_service.
    We import lazily to avoid circular imports.
    """
    from app.services.embedding_service import _generate_with_retry, GENERATIVE_MODEL
    # _generate_with_retry expects a list of messages.
    messages = [{"role": "user", "content": prompt}]
    output = await _generate_with_retry(GENERATIVE_MODEL, messages)
    parsed = _extract_json_array(output)
    # Defensive: ensure list elements are objects.
    cleaned: list[dict[str, Any]] = []
    for item in parsed:
        if not isinstance(item, dict):
            continue
        cleaned.append(item)
    return cleaned


async def generate_dataset_from_github(
    db: AsyncSession,
    user_id: int,
    clone_url: str,
    branch: Optional[str] = None,
    *,
    max_files: int = 20,
    max_defects: int = 50,
    max_zip_bytes: int = 25 * 1024 * 1024,
) -> tuple[Dataset, int]:
    owner, repo = _validate_and_parse_github_url(clone_url)

    async with httpx.AsyncClient(
        timeout=60,
        headers={
            # GitHub may reject requests without a User-Agent.
            "User-Agent": "qa-analytics-ai/1.0",
            "Accept": "application/zip, application/octet-stream;q=0.9, */*;q=0.8",
        },
    ) as client:
        default_branch = await _get_repo_default_branch(client, owner, repo)
        resolved_branch = branch or default_branch
        zip_bytes = await _download_repo_zip(client, owner, repo, resolved_branch)
        if len(zip_bytes) > max_zip_bytes:
            raise ValueError(f"Repository archive too large (max {max_zip_bytes} bytes)")

    with tempfile.TemporaryDirectory() as tmp:
        extract_dir = Path(tmp) / "repo"
        extract_dir.mkdir(parents=True, exist_ok=True)
        _safe_extract_zip(zip_bytes, extract_dir)

        # GitHub archives usually contain a top-level folder: {repo}-{hash}/...
        top_items = [p for p in extract_dir.iterdir()]
        if len(top_items) != 1 or not top_items[0].is_dir():
            # Still attempt: pick the largest dir.
            dirs = [p for p in extract_dir.iterdir() if p.is_dir()]
            if not dirs:
                raise ValueError("Failed to locate extracted repository directory")
            root_dir = max(dirs, key=lambda d: sum(1 for _ in d.rglob("*")))
        else:
            root_dir = top_items[0]

        picked_files = _pick_repo_files(root_dir, max_files=max_files)

        # Read file contents and build a compact prompt.
        files_for_prompt: list[tuple[str, str]] = []
        total_chars = 0
        max_total_chars = 120_000
        for p in picked_files:
            rel = str(p.relative_to(root_dir)).replace("\\", "/")
            content = _read_text_limited(p)
            if not content.strip():
                continue
            if total_chars + len(content) > max_total_chars:
                remaining = max_total_chars - total_chars
                if remaining <= 0:
                    break
                content = content[:remaining]
            files_for_prompt.append((rel, content))
            total_chars += len(content)
            if total_chars >= max_total_chars:
                break

        if not files_for_prompt:
            raise ValueError("No supported files found in the repository")

        prompt = _build_generation_prompt(
            repo_owner=owner,
            repo_name=repo,
            files=files_for_prompt,
            max_defects=max_defects,
        )
        logger.info(
            "Generating testcase document from GitHub repo files",
            extra={"owner": owner, "repo": repo, "branch": resolved_branch, "files": len(files_for_prompt)},
        )
        llm_items = await _generate_testcases_with_llm(prompt)

    if not llm_items:
        raise ValueError("LLM returned no test cases")

    # Create dataset + insert defects.
    file_name = f"github_{owner}_{repo}_{(branch or default_branch).replace('/', '_')}"
    dataset = Dataset(
        user_id=user_id,
        file_name=file_name[:255],
        file_type="repo",
        upload_type="github",
    )
    db.add(dataset)
    await db.flush()

    created = 0
    for item in llm_items[:max_defects]:
        title = item.get("title")
        if not isinstance(title, str) or not title.strip():
            continue
        module = item.get("module")
        severity = item.get("severity")
        priority = item.get("priority")
        environment = item.get("environment")
        status = item.get("status")
        bug_id = item.get("bug_id")
        test_steps = item.get("test_steps")
        expected_result = item.get("expected_result")
        preconditions = item.get("preconditions")

        def _opt_str(v: Any) -> Optional[str]:
            if v is None:
                return None
            if isinstance(v, str):
                v2 = v.strip()
                return v2 if v2 else None
            return None

        db.add(
            Defect(
                dataset_id=dataset.dataset_id,
                bug_id=_opt_str(bug_id),
                title=title.strip(),
                module=_opt_str(module),
                severity=_opt_str(severity),
                priority=_opt_str(priority),
                environment=_opt_str(environment),
                status=_opt_str(status),
                test_steps=_opt_str(test_steps),
                expected_result=_opt_str(expected_result),
                preconditions=_opt_str(preconditions),
            )
        )
        created += 1

    await db.flush()
    if created == 0:
        raise ValueError("No valid test cases produced")

    return dataset, created

