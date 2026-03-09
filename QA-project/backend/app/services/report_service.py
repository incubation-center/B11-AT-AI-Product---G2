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

Produces a self-contained report file stored under backend/reports/.
"""

import csv
import io
import logging
import os
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

logger = logging.getLogger(__name__)

# Directory where generated reports are stored
REPORTS_DIR = Path(__file__).resolve().parent.parent.parent / "reports"
REPORTS_DIR.mkdir(exist_ok=True)


# ─── Helper: collect all analytics data ──────────────────────────────

async def _collect_analytics(db: AsyncSession, dataset_id: int) -> dict:
    """Gather every analytics section into one dict."""
    summary = await get_summary(db, dataset_id)
    severity = await get_severity_distribution(db, dataset_id)
    resolution = await get_resolution_time_stats(db, dataset_id)
    reopen = await get_reopen_rate(db, dataset_id)
    leakage = await get_defect_leakage(db, dataset_id)
    risks = await get_module_risks(db, dataset_id)

    # Raw defects
    result = await db.execute(
        select(Defect).where(Defect.dataset_id == dataset_id).order_by(Defect.defect_id)
    )
    defects = result.scalars().all()

    return {
        "summary": summary,
        "severity": severity,
        "resolution": resolution,
        "reopen": reopen,
        "leakage": leakage,
        "risks": risks,
        "defects": defects,
    }


# ─── PDF Report ──────────────────────────────────────────────────────

def _build_pdf(data: dict, dataset_name: str, out_path: str) -> None:
    """Create a multi-page PDF report using ReportLab."""
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

    elements: list = []

    # ── Title Page ────────────────────────────────────────────────
    elements.append(Spacer(1, 40 * mm))
    elements.append(Paragraph("QA Defect Analytics Report", title_style))
    elements.append(Spacer(1, 6 * mm))
    elements.append(Paragraph(f"Dataset: {dataset_name}", styles["Heading3"]))
    elements.append(Paragraph(
        f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", normal
    ))
    elements.append(PageBreak())

    # ── 1. Defect Summary ─────────────────────────────────────────
    s = data["summary"]
    elements.append(Paragraph("1. Defect Summary", heading_style))
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
    elements.append(Paragraph("2. Severity Distribution", heading_style))
    sev_rows = [["Severity", "Count", "%"]]
    for item in data["severity"]:
        sev_rows.append([item["severity"], str(item["count"]), f"{item['percentage']}%"])
    elements.append(_make_table(sev_rows, col_widths=[60 * mm, 40 * mm, 40 * mm]))
    elements.append(Spacer(1, 6 * mm))

    # ── 3. Resolution Time ────────────────────────────────────────
    r = data["resolution"]
    elements.append(Paragraph("3. Resolution Time Analysis", heading_style))
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

    # ── 4. Reopen Rate ────────────────────────────────────────────
    ro = data["reopen"]
    elements.append(Paragraph("4. Reopen Rate", heading_style))
    reopen_data = [
        ["Metric", "Value"],
        ["Total Defects", str(ro["total_defects"])],
        ["Reopened", str(ro["reopened_count"])],
        ["Rate", f"{ro['reopen_rate_percent']}%"],
        ["Quality", ro["quality_indicator"]],
    ]
    elements.append(_make_table(reopen_data, col_widths=[70 * mm, 50 * mm]))
    elements.append(Spacer(1, 6 * mm))

    # ── 5. Defect Leakage ─────────────────────────────────────────
    lk = data["leakage"]
    elements.append(Paragraph("5. Defect Leakage", heading_style))
    leak_data = [
        ["Metric", "Value"],
        ["Total Defects", str(lk["total_defects"])],
        ["Leaked", str(lk["leaked_count"])],
        ["Leakage Rate", f"{lk['leakage_rate_percent']}%"],
        ["Risk Level", lk["risk_level"]],
    ]
    elements.append(_make_table(leak_data, col_widths=[70 * mm, 50 * mm]))

    if lk["environment_breakdown"]:
        elements.append(Spacer(1, 3 * mm))
        env_rows = [["Environment", "Count"]]
        for eb in lk["environment_breakdown"]:
            env_rows.append([eb["environment"], str(eb["count"])])
        elements.append(_make_table(env_rows, col_widths=[70 * mm, 50 * mm]))
    elements.append(Spacer(1, 6 * mm))

    # ── 6. Module Risk Scores ─────────────────────────────────────
    elements.append(Paragraph("6. Module Risk Scores", heading_style))
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
        elements.append(Paragraph("No module risk data. Run POST /api/analytics/compute/{dataset_id} first.", normal))

    elements.append(PageBreak())

    # ── 7. Defect List ────────────────────────────────────────────
    elements.append(Paragraph("7. Defect List", heading_style))
    defects = data["defects"]
    if defects:
        def_rows = [["Bug ID", "Title", "Module", "Severity", "Status"]]
        for d in defects:
            def_rows.append([
                d.bug_id or "-",
                (d.title[:40] + "…") if d.title and len(d.title) > 40 else (d.title or "-"),
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
    logger.info(f"PDF report generated → {out_path}")


def _make_table(
    data: list[list],
    col_widths: list | None = None,
    font_size: int = 9,
) -> Table:
    """Return a styled ReportLab Table."""
    tbl = Table(data, colWidths=col_widths, hAlign="LEFT")
    style = TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a56db")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), font_size),
        ("FONTSIZE", (0, 1), (-1, -1), font_size),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 3),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ])
    tbl.setStyle(style)
    return tbl


# ─── CSV Report ──────────────────────────────────────────────────────

def _build_csv(data: dict, out_path: str) -> None:
    """Write a CSV file containing the defect list and analytics summary."""
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        # Section 1: Summary
        writer.writerow(["=== DEFECT SUMMARY ==="])
        s = data["summary"]
        writer.writerow(["Metric", "Value"])
        for key in ("total", "open", "in_progress", "closed", "reopened", "unresolved"):
            writer.writerow([key, s[key]])
        writer.writerow([])

        # Section 2: Severity
        writer.writerow(["=== SEVERITY DISTRIBUTION ==="])
        writer.writerow(["Severity", "Count", "Percentage"])
        for item in data["severity"]:
            writer.writerow([item["severity"], item["count"], f"{item['percentage']}%"])
        writer.writerow([])

        # Section 3: Resolution
        writer.writerow(["=== RESOLUTION TIME ==="])
        r = data["resolution"]
        writer.writerow(["Metric", "Value"])
        for key in ("total_resolved", "avg_days", "median_days", "min_days", "max_days", "percentile_90"):
            writer.writerow([key, r.get(key, "N/A")])
        writer.writerow([])

        # Section 4: Reopen Rate
        writer.writerow(["=== REOPEN RATE ==="])
        ro = data["reopen"]
        writer.writerow(["Metric", "Value"])
        for key in ("total_defects", "reopened_count", "reopen_rate_percent", "quality_indicator"):
            writer.writerow([key, ro[key]])
        writer.writerow([])

        # Section 5: Leakage
        writer.writerow(["=== DEFECT LEAKAGE ==="])
        lk = data["leakage"]
        writer.writerow(["Metric", "Value"])
        for key in ("total_defects", "leaked_count", "leakage_rate_percent", "risk_level"):
            writer.writerow([key, lk[key]])
        writer.writerow([])

        # Section 6: Module Risks
        writer.writerow(["=== MODULE RISK SCORES ==="])
        writer.writerow(["Module", "Bug Count", "Reopen Rate %", "Risk Score", "Risk Level"])
        for mr in data["risks"]:
            writer.writerow([
                mr["module_name"], mr["bug_count"],
                f"{mr.get('reopen_rate') or 0:.1f}",
                f"{mr.get('risk_score') or 0:.2f}",
                mr.get("risk_level") or "N/A",
            ])
        writer.writerow([])

        # Section 7: Full defect list
        writer.writerow(["=== DEFECT LIST ==="])
        writer.writerow(["Bug ID", "Title", "Module", "Severity", "Priority",
                         "Environment", "Status", "Created", "Resolved", "Closed"])
        for d in data["defects"]:
            writer.writerow([
                d.bug_id or "",
                d.title or "",
                d.module or "",
                d.severity or "",
                d.priority or "",
                d.environment or "",
                d.status or "",
                str(d.created_date) if d.created_date else "",
                str(d.resolved_date) if d.resolved_date else "",
                str(d.closed_date) if d.closed_date else "",
            ])

    logger.info(f"CSV report generated → {out_path}")


# ─── Excel Report ────────────────────────────────────────────────────

def _build_excel(data: dict, dataset_name: str, out_path: str) -> None:
    """Write an Excel workbook with multiple sheets for each analytics section."""
    with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
        # Sheet 1: Summary
        s = data["summary"]
        summary_df = pd.DataFrame([
            {"Metric": k, "Value": v}
            for k, v in s.items() if k != "dataset_id"
        ])
        summary_df.to_excel(writer, sheet_name="Summary", index=False)

        # Sheet 2: Severity
        sev_df = pd.DataFrame(data["severity"])
        if not sev_df.empty:
            sev_df.to_excel(writer, sheet_name="Severity", index=False)

        # Sheet 3: Resolution Time
        r = data["resolution"]
        res_df = pd.DataFrame([
            {"Metric": k, "Value": v}
            for k, v in r.items() if k != "dataset_id"
        ])
        res_df.to_excel(writer, sheet_name="Resolution Time", index=False)

        # Sheet 4: Reopen Rate
        ro = data["reopen"]
        reopen_df = pd.DataFrame([
            {"Metric": k, "Value": v}
            for k, v in ro.items() if k != "dataset_id"
        ])
        reopen_df.to_excel(writer, sheet_name="Reopen Rate", index=False)

        # Sheet 5: Defect Leakage
        lk = data["leakage"]
        leakage_df = pd.DataFrame([
            {"Metric": k, "Value": v}
            for k, v in lk.items()
            if k not in ("dataset_id", "environment_breakdown")
        ])
        leakage_df.to_excel(writer, sheet_name="Leakage", index=False)

        if lk["environment_breakdown"]:
            env_df = pd.DataFrame(lk["environment_breakdown"])
            env_df.to_excel(writer, sheet_name="Leakage Env", index=False)

        # Sheet 6: Module Risks
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

        # Sheet 7: Defect List
        defects = data["defects"]
        if defects:
            defect_rows = [{
                "Bug ID": d.bug_id or "",
                "Title": d.title or "",
                "Module": d.module or "",
                "Severity": d.severity or "",
                "Priority": d.priority or "",
                "Environment": d.environment or "",
                "Status": d.status or "",
                "Created": str(d.created_date) if d.created_date else "",
                "Resolved": str(d.resolved_date) if d.resolved_date else "",
                "Closed": str(d.closed_date) if d.closed_date else "",
            } for d in defects]
            defect_df = pd.DataFrame(defect_rows)
            defect_df.to_excel(writer, sheet_name="Defect List", index=False)

    logger.info(f"Excel report generated → {out_path}")


# ─── Public API ──────────────────────────────────────────────────────

EXTENSION_MAP = {"pdf": ".pdf", "csv": ".csv", "excel": ".xlsx"}


async def generate_report(
    db: AsyncSession,
    user_id: int,
    dataset_id: int,
    report_format: str = "pdf",
) -> Report:
    """
    Generate a report file and save a reference in the reports table.
    Returns the Report ORM object.
    """
    # Validate dataset
    result = await db.execute(
        select(Dataset).where(Dataset.dataset_id == dataset_id)
    )
    dataset = result.scalar_one_or_none()
    if not dataset:
        raise ValueError(f"Dataset {dataset_id} not found")

    # Collect analytics data
    data = await _collect_analytics(db, dataset_id)

    # Build file path
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    ext = EXTENSION_MAP.get(report_format, ".pdf")
    file_name = f"report_ds{dataset_id}_{ts}{ext}"
    out_path = str(REPORTS_DIR / file_name)

    # Generate the file
    if report_format == "pdf":
        _build_pdf(data, dataset.file_name, out_path)
    elif report_format == "csv":
        _build_csv(data, out_path)
    elif report_format == "excel":
        _build_excel(data, dataset.file_name, out_path)
    else:
        raise ValueError(f"Unsupported report format: {report_format}")

    # Save report record
    report = Report(
        user_id=user_id,
        dataset_id=dataset_id,
        report_type=report_format,
        file_path=out_path,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)

    logger.info(f"Report {report.report_id} created for dataset {dataset_id} ({report_format})")
    return report


async def list_reports(db: AsyncSession, dataset_id: int) -> list[Report]:
    """Return all reports for a dataset, newest first."""
    result = await db.execute(
        select(Report)
        .where(Report.dataset_id == dataset_id)
        .order_by(Report.generated_at.desc())
    )
    return list(result.scalars().all())


async def get_report_by_id(db: AsyncSession, report_id: int) -> Report | None:
    """Fetch a single report by ID."""
    result = await db.execute(
        select(Report).where(Report.report_id == report_id)
    )
    return result.scalar_one_or_none()
