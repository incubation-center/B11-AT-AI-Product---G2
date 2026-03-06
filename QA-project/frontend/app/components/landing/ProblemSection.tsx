import React from "react";

export function ProblemSection() {
  return (
    <section className="problem-section" id="problem">
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <span className="section-eyebrow">The Problem</span>
        <h2 className="section-title">
          Your QA data is sitting there.
          <br />
          <em>Doing nothing.</em>
        </h2>
        <div className="problem-grid">
          <div className="problem-list">
            <div className="prob-item">
              <div className="prob-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </div>
              <div>
                <div className="prob-title">The same bugs keep coming back</div>
                <div className="prob-desc">
                  Without pattern analysis, teams fix the same defects release
                  after release &mdash; wasting engineering time on problems
                  already seen before.
                </div>
              </div>
            </div>
            <div className="prob-item">
              <div className="prob-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
                </svg>
              </div>
              <div>
                <div className="prob-title">
                  QA knowledge walks out the door
                </div>
                <div className="prob-desc">
                  When senior QA engineers leave, their tribal knowledge about
                  risky modules and historical failure patterns leaves with
                  them.
                </div>
              </div>
            </div>
            <div className="prob-item">
              <div className="prob-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>
              <div>
                <div className="prob-title">
                  Test cases miss the dangerous spots
                </div>
                <div className="prob-desc">
                  Teams write test cases without knowing which areas have
                  historically failed. Coverage looks good on paper, but the
                  riskiest code goes untested.
                </div>
              </div>
            </div>
            <div className="prob-item">
              <div className="prob-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <div className="prob-title">
                  Manual bug analysis is too slow
                </div>
                <div className="prob-desc">
                  Manually sifting through hundreds of tickets before each
                  release to understand regression risk takes hours &mdash; if
                  it happens at all.
                </div>
              </div>
            </div>
          </div>
          <div className="problem-visual">
            <div className="pv-title">Without QA Intelligence</div>
            <div className="pv-stat-row">
              <div>
                <div className="pv-stat-label">
                  Recurring defects per release
                </div>
                <div className="pv-stat-sub">
                  Same bugs filed multiple times
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="pv-stat-val">34%</div>
              </div>
            </div>
            <div className="pv-stat-row">
              <div>
                <div className="pv-stat-label">
                  Time spent on manual analysis
                </div>
                <div className="pv-stat-sub">Before each release cycle</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="pv-stat-val">8hrs</div>
              </div>
            </div>
            <div className="pv-stat-row">
              <div>
                <div className="pv-stat-label">
                  Regressions caught in production
                </div>
                <div className="pv-stat-sub">
                  That should&apos;ve been caught in QA
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="pv-stat-val">61%</div>
              </div>
            </div>
            <div className="pv-stat-row" style={{ border: "none" }}>
              <div>
                <div className="pv-stat-label">
                  Test coverage of high-risk modules
                </div>
                <div className="pv-stat-sub">
                  Historically most bug-prone areas
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="pv-stat-val">28%</div>
              </div>
            </div>
            <div
              style={{
                marginTop: "20px",
                padding: "14px",
                background: "rgba(13,148,136,.08)",
                borderRadius: "8px",
                border: "1px solid rgba(13,148,136,.2)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--teal2)",
                  fontWeight: 500,
                  marginBottom: "4px",
                }}
              >
                &#10022; With QA Intelligence
              </div>
              <div style={{ fontSize: "12px", color: "var(--ink2)" }}>
                Teams using our RAG pipeline report 60% fewer recurring bugs and
                3&times; faster pre-release risk assessment.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
