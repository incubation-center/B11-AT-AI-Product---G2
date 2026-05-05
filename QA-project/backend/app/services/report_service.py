"""
Report Service — generates PDF, CSV, and Excel reports from analytics data.

Collects:
  • Defect summary
  • Severity distribution
  • Resolution time statistics
  • Reopen rate
  • Defect leakage
  • Module risk scores
  • Raw defect list
  • AI-generated Test Plan Details (Project Name, Version, Author, Date, Scope - In, Scope - Out, Test Objectives, Test Strategy, Test Environment, Test Data, Entry Criteria, Exit Criteria, Risks)

Produces a self-contained report file stored in Supabase Storage.
"""

import csv
import io
import json
import logging
import os
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Optional

import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    PageBreak,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import boto3

from app.config import settings
from app.models.datasets import Dataset
from app.models.defects import Defect
from app.models.reports import Report
from app.services.analytics_service import (
    get_summary,
    get_severity_distribution,
    get_resolution_time_stats,
    get_reopen_rate,
    get_defect_leakage,
)
from app.services.risk_service import get_module_risks
from app.services.embedding_service import _generate_with_retry, GENERATIVE_MODEL

logger = logging.getLogger(__name__)

# ─── Boto3 S3 Client (Supabase) ─────────────────────────────────────────

def get_s3_client():
    url = settings.SUPABASE_URL
    access_key = settings.SUPABASE_ACCESS_KEY
    secret_key = settings.SUPABASE_SECRET_KEY
    if not url or not access_key or not secret_key:
        raise ValueError("SUPABASE_URL, SUPABASE_ACCESS_KEY, and SUPABASE_SECRET_KEY must be set in .env")
    
    return boto3.client(
        's3',
        endpoint_url=url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name='auto'  # Supabase S3 region isn't strict, but 'auto' or 'us-east-1' works
    )


# ─── Helper: AI Test Plan Generation ─────────────────────────────────

async def _generate_test_plan_ai(data: dict, dataset_name: str) -> dict:
    """Uses LLM to generate the Test Plan Details section."""
    summary = data["summary"]
    severity = data["severity"]
    risks = data["risks"]
    
    prompt = (
        f"You are a QA Lead. Based on the following defect data from dataset '{dataset_name}', "
        "generate a concise, professional 'Test Plan Details' overview. Use realistic, well-formatted QA terminology. "
        "Return ONLY a JSON dictionary exactly matching these keys:\n"
        "- Project Name (string)\n"
        "- Version (string)\n"
        "- Author (string)\n"
        "- Scope - In (string)\n"
        "- Scope - Out (string)\n"
        "- Test Objectives (string)\n"
        "- Test Strategy (string)\n"
        "- Test Environment (string)\n"
        "- Test Data (string)\n"
        "- Entry Criteria (string)\n"
        "- Exit Criteria (string)\n"
        "- Risks (string)\n\n"
        f"Data Summary: total {summary['total']}, open {summary['open']}, closed {summary['closed']}.\n"
        f"Severity Dist: {severity}\n"
        f"Top Modules at Risk: {[r['module_name'] for r in (risks or [])[:5]]}\n\n"
        "Ensure the text is professional and descriptive. Infer details realistically. ONLY Output valid JSON."
    )
    
    try:
        resp = await _generate_with_retry(GENERATIVE_MODEL, [{"role": "user", "content": prompt}])
        s = resp.find("{")
        e = resp.rfind("}")
        if s != -1 and e != -1:
            return json.loads(resp[s:e+1])
    except Exception as ex:
        logger.error(f"Failed to generate QA plan: {ex}")
        
    # Return sensible defaults if AI fails
    return {
        "Project Name": dataset_name,
        "Version": "1.0",
        "Author": "QA Analytics AI",
        "Scope - In": "All modules tested in this cycle.",
        "Scope - Out": "Out of scope features for this sprint.",
        "Test Objectives": "Verify system stability and core functionality.",
        "Test Strategy": "Automated and manual regression testing.",
        "Test Environment": "Staging / Production",
        "Test Data": "Defect data gathered from the test cycle.",
        "Entry Criteria": "Code freeze and deployment to test environment.",
        "Exit Criteria": "No critical defects remaining.",
        "Risks": "Unresolved defects affecting upcoming release.",
    }


# ─── Helper: collect all analytics data ──────────────────────────────

async def _collect_analytics(db: AsyncSession, dataset_id: int, dataset_name: str) -> dict:
    summary = await get_summary(db, dataset_id)
    severity = await get_severity_distribution(db, dataset_id)
    resolution = await get_resolution_time_stats(db, dataset_id)
    reopen = await get_reopen_rate(db, dataset_id)
    leakage = await get_defect_leakage(db, dataset_id)
    risks = await get_module_risks(db, dataset_id)

    result = await db.execute(
        select(Defect).where(Defect.dataset_id == dataset_id).order_by(Defect.defect_id)
    )
    defects = result.scalars().all()

    data = {
        "summary": summary,
        "severity": severity,
        "resolution": resolution,
        "reopen": reopen,
        "leakage": leakage,
        "risks": risks,
        "defects": defects,
    }
    
    data["test_plan"] = await _generate_test_plan_ai(data, dataset_name)
    return data


# ─── PDF Report ──────────────────────────────────────────────────────

def _build_pdf(data: dict, dataset_name: str, out_path: str) -> None:
    doc = SimpleDocTemplate(
        out_path,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        leftMargin=15 * mm,
        rightMargin=15 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=20,
        spaceAfter=12,
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=14,
        spaceAfter=8,
        spaceBefore=16,
        textColor=colors.HexColor("#1a56db"),
    )
    normal = styles["Normal"]
    elements = []

    elements.append(Spacer(1, 20 * mm))
    elements.append(Paragraph("QA Test Report & Analytics", title_style))
    elements.append(Spacer(1, 6 * mm))
    elements.append(Paragraph(f"Dataset: {dataset_name}", styles["Heading3"]))
    elements.append(Paragraph(f"Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", normal))
    elements.append(PageBreak())

    # ── AI Generated Test Plan Details ────────────────────────────────
    elements.append(Paragraph("Test Plan Details (AI Generated)", heading_style))
    tp = data["test_plan"]
    tp_data = [["Section", "Details"]]
    for k, v in tp.items():
        tp_data.append([k, Paragraph(str(v), normal)])
        
    elements.append(_make_table(tp_data, col_widths=[40 * mm, 120 * mm]))
    elements.append(PageBreak())

    # ── 1. Defect Summary ─────────────────────────────────────────
    s = data["summary"]
    elements.append(Paragraph("Defect Summary", heading_style))
    summary_data = [
        ["Metric", "Value"],
        ["Total Defects", str(s["total"])],
        ["Open", str(s["open"])],
        ["In Progress", str(s["in_progress"])],
        ["Closed", str(s["closed"])],
        ["Reopened", str(s["reopened"])],
        ["Unresolved", str(s["unresolved"])],
    ]
    elements.append(_make_table(summary_data, col_widths=[70 * mm, 50 * mm]))
    elements.append(Spacer(1, 6 * mm))

    # ── 2. Severity Distribution ──────────────────────────────────
    elements.append(Paragraph("Severity Distribution", heading_style))
    sev_rows = [["Severity", "Count", "%"]]
    for item in data["severity"]:
        sev_rows.append([item["severity"], str(item["count"]), f"{item['percentage']}%"])
    elements.append(_make_table(sev_rows, col_widths=[60 * mm, 40 * mm, 40 * mm]))
    elements.append(Spacer(1, 6 * mm))

    # ── 3. Resolution Time ────────────────────────────────────────
    r = data["resolution"]
    elements.append(Paragraph("Resolution Time Analysis", heading_style))
    res_data = [
        ["Metric", "Value"],
        ["Total Resolved", str(r["total_resolved"])],
        ["Avg (days)", str(r.get("avg_days", "N/A"))],
        ["Median (days)", str(r.get("median_days", "N/A"))],
        ["Min (days)", str(r.get("min_days", "N/A"))],
        ["Max (days)", str(r.get("max_days", "N/A"))],
        ["90th Percentile", str(r.get("percentile_90", "N/A"))],
    ]
    elements.append(_make_table(res_data, col_widths=[70 * mm, 50 * mm]))
    elements.append(Spacer(1, 6 * mm))

    # ── 6. Module Risk Scores ─────────────────────────────────────
    elements.append(Paragraph("Module Risk Scores", heading_style))
    risks = data["risks"]
    if risks:
        risk_rows = [["Module", "Bugs", "Reopen %", "Score", "Level"]]
        for mr in risks:
            risk_rows.append([
                mr["module_name"],
                str(mr["bug_count"]),
                f"{mr.get('reopen_rate') or 0:.1f}%",
                f"{mr.get('risk_score') or 0:.2f}",
                mr.get("risk_level") or "N/A",
            ])
        elements.append(_make_table(risk_rows, col_widths=[45 * mm, 25 * mm, 30 * mm, 30 * mm, 30 * mm]))
    else:
        elements.append(Paragraph("No module risk data.", normal))

    elements.append(PageBreak())

    # ── 7. Defect List ────────────────────────────────────────────
    elements.append(Paragraph("Defect List", heading_style))
    defects = data["defects"]
    if defects:
        def_rows = [["Bug ID", "Title", "Module", "Severity", "Status"]]
        for d in defects:
            def_rows.append([
                d.bug_id or "-",
                (d.title[:35] + "…") if d.title and len(d.title) > 35 else (d.title or "-"),
                d.module or "-",
                d.severity or "-",
                d.status or "-",
            ])
        elements.append(_make_table(
            def_rows,
            col_widths=[25 * mm, 60 * mm, 30 * mm, 25 * mm, 25 * mm],
            font_size=8,
        ))
    else:
        elements.append(Paragraph("No defects found.", normal))

    doc.build(elements)


def _make_table(data: list[list], col_widths: list | None = None, font_size: int = 9) -> Table:
    tbl = Table(data, colWidths=col_widths, hAlign="LEFT")
    style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a56db")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), font_size),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 3),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ])
    tbl.setStyle(style)
    return tbl


# ─── CSV Report ──────────────────────────────────────────────────────

def _build_csv(data: dict, out_path: str) -> None:
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        writer.writerow(["=== TEST PLAN DETAILS (AI) ==="])
        writer.writerow(["Section", "Details"])
        for k, v in data["test_plan"].items():
            writer.writerow([k, v])
        writer.writerow([])

        writer.writerow(["=== DEFECT SUMMARY ==="])
        s = data["summary"]
        writer.writerow(["Metric", "Value"])
        for key in ("total", "open", "in_progress", "closed", "reopened", "unresolved"):
            writer.writerow([key, s[key]])
        writer.writerow([])

        writer.writerow(["=== SEVERITY DISTRIBUTION ==="])
        writer.writerow(["Severity", "Count", "Percentage"])
        for item in data["severity"]:
            writer.writerow([item["severity"], item["count"], f"{item['percentage']}%"])
        writer.writerow([])

        writer.writerow(["=== DEFECT LIST ==="])
        writer.writerow(["Bug ID", "Title", "Module", "Severity", "Priority",
                         "Environment", "Status", "Created", "Resolved", "Closed"])
        for d in data["defects"]:
            writer.writerow([
                d.bug_id or "", d.title or "", d.module or "", d.severity or "",
                d.priority or "", d.environment or "", d.status or "",
                str(d.created_date) if d.created_date else "",
                str(d.resolved_date) if d.resolved_date else "",
                str(d.closed_date) if d.closed_date else "",
            ])


# ─── Excel Report ────────────────────────────────────────────────────

def _build_excel(data: dict, dataset_name: str, out_path: str) -> None:
    with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
        
        # Sheet 1: Test Plan
        tp_df = pd.DataFrame([{"Section": k, "Details": v} for k, v in data["test_plan"].items()])
        tp_df.to_excel(writer, sheet_name="Test Plan Details", index=False)
        worksheet = writer.sheets["Test Plan Details"]
        worksheet.column_dimensions['A'].width = 25
        worksheet.column_dimensions['B'].width = 80

        # Sheet 2: Summary
        s = data["summary"]
        summary_df = pd.DataFrame([
            {"Metric": k, "Value": v}
            for k, v in s.items() if k != "dataset_id"
        ])
        summary_df.to_excel(writer, sheet_name="Summary", index=False)

        # Sheet 3: Module Risks
        risks = data["risks"]
        if risks:
            risk_rows = [{
                "Module": mr["module_name"],
                "Bug Count": mr["bug_count"],
                "Reopen Rate %": f"{mr.get('reopen_rate') or 0:.1f}",
                "Risk Score": f"{mr.get('risk_score') or 0:.2f}",
                "Risk Level": mr.get("risk_level") or "N/A",
            } for mr in risks]
            risk_df = pd.DataFrame(risk_rows)
            risk_df.to_excel(writer, sheet_name="Module Risks", index=False)

        # Sheet 4: Defect List
        defects = data["defects"]
        if defects:
            defect_rows = [{
                "Bug ID": d.bug_id or "",
                "Title": d.title or "",
                "Module": d.module or "",
                "Severity": d.severity or "",
                "Status": d.status or "",
            } for d in defects]
            defect_df = pd.DataFrame(defect_rows)
            defect_df.to_excel(writer, sheet_name="Defect List", index=False)


# ─── Public API ──────────────────────────────────────────────────────

EXTENSION_MAP = {"pdf": ".pdf", "csv": ".csv", "excel": ".xlsx"}


async def generate_report(
    db: AsyncSession,
    user_id: int,
    dataset_id: int,
    report_format: str = "pdf",
) -> Report:
    result = await db.execute(select(Dataset).where(Dataset.dataset_id == dataset_id))
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise ValueError(f"Dataset {dataset_id} not found")

    data = await _collect_analytics(db, dataset_id, dataset.file_name)

    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    ext = EXTENSION_MAP.get(report_format, ".pdf")
    file_name = f"report_ds{dataset_id}_{ts}{ext}"
    
    # Store locally in temp folder to upload
    temp_dir = Path(tempfile.gettempdir())
    out_path = str(temp_dir / file_name)

    if report_format == "pdf":
        _build_pdf(data, dataset.file_name, out_path)
    elif report_format == "csv":
        _build_csv(data, out_path)
    elif report_format == "excel":
        _build_excel(data, dataset.file_name, out_path)
    else:
        raise ValueError(f"Unsupported report format: {report_format}")

    # Upload to Supabase Storage via S3
    s3 = get_s3_client()
    try:
        with open(out_path, "rb") as f:
            file_bytes = f.read()
        media_type = "application/octet-stream"
        if report_format == "pdf": media_type = "application/pdf"
        elif report_format == "csv": media_type = "text/csv"
        elif report_format == "excel": media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            
        # Hardcoding the bucket name to 'reports' as requested
        s3.put_object(
            Bucket='reports',
            Key=file_name,
            Body=file_bytes,
            ContentType=media_type
        )
        logger.info(f"Supabase S3 upload successful for: {file_name}")
        
    except Exception as e:
        logger.error(f"Failed to upload report to Supabase Storage via S3: {e}")
        raise ValueError("Storage configuration error. Please ensure your Supabase S3 keys/urls are correct in the .env file.")

    finally:
        # Cleanup temp file
        if os.path.exists(out_path):
            os.remove(out_path)

    # Note: We save the file_name (the storage key) instead of the local path
    report = Report(
        user_id=user_id,
        dataset_id=dataset_id,
        report_type=report_format,
        file_path=file_name,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)

    return report


async def list_reports(db: AsyncSession, dataset_id: int) -> list[Report]:
    result = await db.execute(
        select(Report)
        .where(Report.dataset_id == dataset_id)
        .order_by(Report.generated_at.desc())
    )
    return list(result.scalars().all())


async def get_report_by_id(db: AsyncSession, report_id: int) -> Report | None:
    result = await db.execute(select(Report).where(Report.report_id == report_id))
    return result.scalar_one_or_none()
