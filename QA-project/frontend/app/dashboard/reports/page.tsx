"use client";

import React, { useState } from "react";

type Report = {
  id: string;
  title: string;
  desc: string;
  date: string;
  tag: string;
};

const MOCK_REPORTS: Report[] = [
  {
    id: "1",
    title: "Q1 Regression Risk Analysis",
    desc: "Predictive analysis of modules most likely to fail in the upcoming March release.",
    date: "Mar 05, 2026",
    tag: "Predictive",
  },
  {
    id: "2",
    title: "Authentication Module Coverage",
    desc: "Detailed breakdown of test coverage gaps within the newly updated OAuth flow.",
    date: "Feb 28, 2026",
    tag: "Coverage",
  },
  {
    id: "3",
    title: "Performance Degradation Report",
    desc: "Identified API endpoints with >20% latency increase over the last 14 days.",
    date: "Feb 20, 2026",
    tag: "Performance",
  },
  {
    id: "4",
    title: "Weekly Bug Triage Summary",
    desc: "Auto-generated summary of all critical and high-severity defects logged this week.",
    date: "Feb 14, 2026",
    tag: "Weekly",
  },
  {
    id: "5",
    title: "Flaky Test Auto-Resolution Logs",
    desc: "List of tests automatically quarantined or fixed by the AI engine this month.",
    date: "Feb 01, 2026",
    tag: "System",
  },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<Report | null>(null);

  if (activeReport) {
    return (
      <div className="dash-content" style={{ padding: 0 }}>
        <div className="report-detail animate-fade-in">
          <button className="rd-back" onClick={() => setActiveReport(null)}>
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Reports
          </button>

          <div className="rd-header">
            <div>
              <h1 className="rd-title">{activeReport.title}</h1>
              <div className="rd-meta-wrap">
                <span>Generated: {activeReport.date}</span>
                <span>&bull;</span>
                <span style={{ color: "var(--teal2)" }}>
                  {activeReport.tag} Engine
                </span>
              </div>
            </div>
            <button className="dash-btn dash-btn-primary">Export as PDF</button>
          </div>

          <div className="rd-summary-box">
            <div className="rd-summary-title flex items-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
              AI Executive Summary
            </div>
            <div className="rd-summary-text">
              Based on the latest data ingestion, our predictive models show a
              high likelihood of regression in the{" "}
              <strong>Authentication</strong> and <strong>Billing</strong>{" "}
              modules for the upcoming release. We have identified 14 critical
              coverage gaps related to OAuth flows. It is highly recommended to
              allocate additional manual exploratory testing to these areas
              before code freeze.
            </div>
          </div>

          <div className="rd-grid">
            <div className="rd-card">
              <h3>Predicted Defect Burn-down</h3>
              <div className="rd-line-chart">
                <svg
                  className="rd-svg-line"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path
                    className="rd-svg-area"
                    d="M0,100 L0,20 L25,40 L50,10 L75,60 L100,80 L100,100 Z"
                  />
                  <path
                    className="rd-svg-path"
                    d="M0,20 L25,40 L50,10 L75,60 L100,80"
                  />
                </svg>
                {/* Simulated CSS Columns/Dots */}
                <div className="rd-col">
                  <div className="rd-dot" style={{ bottom: "80%" }}></div>
                  <span className="rd-col-label">Mon</span>
                </div>
                <div className="rd-col">
                  <div className="rd-dot" style={{ bottom: "60%" }}></div>
                  <span className="rd-col-label">Tue</span>
                </div>
                <div className="rd-col">
                  <div className="rd-dot" style={{ bottom: "90%" }}></div>
                  <span className="rd-col-label">Wed</span>
                </div>
                <div className="rd-col">
                  <div className="rd-dot" style={{ bottom: "40%" }}></div>
                  <span className="rd-col-label">Thu</span>
                </div>
                <div className="rd-col">
                  <div className="rd-dot" style={{ bottom: "20%" }}></div>
                  <span className="rd-col-label">Fri</span>
                </div>
              </div>
            </div>

            <div className="rd-card">
              <h3>Key Insights</h3>
              <div className="rd-insight-list">
                <div className="rd-insight">
                  <div className="rd-insight-dot coral"></div>
                  <div className="rd-insight-text">
                    Authentication defect rate is <strong>42%</strong> higher
                    than historical average.
                  </div>
                </div>
                <div className="rd-insight">
                  <div className="rd-insight-dot amber"></div>
                  <div className="rd-insight-text">
                    5 Flaky tests identified in the User Profile test suite.
                  </div>
                </div>
                <div className="rd-insight">
                  <div className="rd-insight-dot teal"></div>
                  <div className="rd-insight-text">
                    API Gateway latency has stabilized since the recent hotfix.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Reports</h1>
        <div className="dash-header-actions">
          <button className="dash-btn dash-btn-primary">
            + Generate Report
          </button>
        </div>
      </div>

      <div className="dash-content">
        <div className="report-grid">
          {MOCK_REPORTS.map((report) => (
            <div
              key={report.id}
              className="report-card animate-fade-in"
              onClick={() => setActiveReport(report)}
            >
              <div className="rc-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
              <h3 className="rc-title">{report.title}</h3>
              <p className="rc-desc">{report.desc}</p>
              <div className="rc-meta">
                <span className="rc-date">{report.date}</span>
                <span className="rc-tag">{report.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
