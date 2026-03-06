"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useBilling } from "../contexts/BillingContext";

export default function DashboardOverviewPage() {
  // 'loading' | 'empty' | 'populated'
  const [dashboardState, setDashboardState] = useState<
    "loading" | "empty" | "populated"
  >("loading");

  useEffect(() => {
    // Simulate loading data from backend
    const timer1 = setTimeout(() => {
      // Let's pretend the user has no data first to show the empty state
      // For this demo, we'll actually transition to 'populated' after briefly showing 'empty'
      // to let the user see the whole flow. Real app would check a condition.

      // Let's just make it populated after 2 seconds to match the request,
      // but in real life we fetch data here.
      setDashboardState("populated");
    }, 2000);

    return () => clearTimeout(timer1);
  }, []);

  return (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Dashboard</h1>
        <div className="dash-header-actions">
          {dashboardState !== "loading" && (
            <>
              <span className="dash-date">Last 30 days ▾</span>
              <Link
                href="/dashboard/upload"
                className="dash-btn dash-btn-primary"
              >
                + Upload Data
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="dash-content">
        {dashboardState === "loading" && <DashboardLoading />}
        {dashboardState === "empty" && <DashboardEmpty />}
        {dashboardState === "populated" && <DashboardPopulated />}
      </div>

      {/* Dev Toggle for the user to easily switch states for review */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "10px",
          display: "flex",
          gap: "8px",
          zIndex: 100,
        }}
      >
        <span
          style={{
            fontSize: "12px",
            color: "var(--ink3)",
            alignSelf: "center",
            marginRight: "4px",
          }}
        >
          Dev Toggle:
        </span>
        <button
          onClick={() => setDashboardState("loading")}
          style={{
            background: "var(--bg)",
            color: "var(--ink2)",
            border: "1px solid var(--border)",
            padding: "4px 8px",
            fontSize: "11px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Loading
        </button>
        <button
          onClick={() => setDashboardState("empty")}
          style={{
            background: "var(--bg)",
            color: "var(--ink2)",
            border: "1px solid var(--border)",
            padding: "4px 8px",
            fontSize: "11px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Empty
        </button>
        <button
          onClick={() => setDashboardState("populated")}
          style={{
            background: "var(--bg)",
            color: "var(--ink2)",
            border: "1px solid var(--border)",
            padding: "4px 8px",
            fontSize: "11px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Populated
        </button>
      </div>
    </>
  );
}

function DashboardLoading() {
  return (
    <>
      <div className="metric-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="metric-card" style={{ height: "110px" }}>
            <div
              className="skeleton-shimmer"
              style={{ width: "60%", height: "12px", marginBottom: "16px" }}
            ></div>
            <div
              className="skeleton-shimmer"
              style={{ width: "40%", height: "32px", marginBottom: "12px" }}
            ></div>
            <div
              className="skeleton-shimmer"
              style={{ width: "70%", height: "10px" }}
            ></div>
          </div>
        ))}
      </div>
      <div className="charts-grid">
        <div className="chart-card" style={{ height: "320px" }}>
          <div
            className="skeleton-shimmer"
            style={{ width: "40%", height: "14px", marginBottom: "32px" }}
          ></div>
          <div
            className="skeleton-shimmer"
            style={{ width: "100%", height: "200px" }}
          ></div>
        </div>
        <div className="chart-card" style={{ height: "320px" }}>
          <div
            className="skeleton-shimmer"
            style={{ width: "50%", height: "14px", marginBottom: "32px" }}
          ></div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "24px",
            }}
          >
            <div
              className="skeleton-shimmer"
              style={{ width: "120px", height: "120px", borderRadius: "50%" }}
            ></div>
          </div>
          <div
            className="skeleton-shimmer"
            style={{ width: "80%", height: "10px", margin: "0 auto 12px" }}
          ></div>
          <div
            className="skeleton-shimmer"
            style={{ width: "60%", height: "10px", margin: "0 auto" }}
          ></div>
        </div>
      </div>
    </>
  );
}

function DashboardEmpty() {
  return (
    <div className="empty-state-card">
      <div className="esc-icon">🌱</div>
      <h2 className="esc-title">Welcome to your Workspace</h2>
      <p className="esc-desc">
        Your dashboard is looking a bit empty. Upload your first test execution
        dataset or Jira bug export to generate AI-powered insights.
      </p>

      <div className="onboarding-list">
        <div className="ol-item done">
          <div className="ol-icon t-done">✓</div>
          <div className="ol-text">Create your QA Intelligence account</div>
        </div>
        <div className="ol-item">
          <div className="ol-icon t-pending"></div>
          <div className="ol-text">
            Upload your first dataset
            <Link
              href="/dashboard/upload"
              style={{
                color: "var(--teal)",
                fontSize: "13px",
                marginLeft: "12px",
                textDecoration: "none",
              }}
            >
              Go to Upload →
            </Link>
          </div>
        </div>
        <div className="ol-item">
          <div className="ol-icon t-pending"></div>
          <div className="ol-text" style={{ color: "var(--ink3)" }}>
            Analyze root causes with AI Chat
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPopulated() {
  const { planType } = useBilling();

  return (
    <>
      <div className="metric-grid">
        <div className="metric-card">
          <div className="mc-label">Total Defects</div>
          <div className="mc-value">1,284</div>
          <div className="mc-delta positive">↑ 12% vs last month</div>
        </div>
        <div className="metric-card">
          <div className="mc-label">Open</div>
          <div className="mc-value" style={{ color: "var(--coral)" }}>
            342
          </div>
          <div className="mc-delta negative">↓ 8% vs last month</div>
        </div>
        <div className="metric-card">
          <div className="mc-label">Closed</div>
          <div className="mc-value" style={{ color: "var(--green)" }}>
            891
          </div>
          <div className="mc-delta positive">↑ 5% closure rate</div>
        </div>
        <div className="metric-card">
          <div className="mc-label">Critical</div>
          <div className="mc-value" style={{ color: "var(--amber)" }}>
            51
          </div>
          <div className="mc-delta negative">↓ 3 this week</div>
        </div>
      </div>

      <div className="charts-grid" style={{ marginBottom: "24px" }}>
        <div className="chart-card">
          <div className="cc-header">Defect Trend &mdash; Last 6 Months</div>
          <div className="bar-chart">
            <div className="bar-group">
              <div
                className="bar"
                style={{ height: "40%", opacity: 0.6 }}
              ></div>
              <div className="bar-label">Oct</div>
            </div>
            <div className="bar-group">
              <div
                className="bar"
                style={{ height: "45%", opacity: 0.7 }}
              ></div>
              <div className="bar-label">Nov</div>
            </div>
            <div className="bar-group">
              <div
                className="bar"
                style={{ height: "35%", opacity: 0.5 }}
              ></div>
              <div className="bar-label">Dec</div>
            </div>
            <div className="bar-group">
              <div
                className="bar"
                style={{ height: "55%", opacity: 0.8 }}
              ></div>
              <div className="bar-label">Jan</div>
            </div>
            <div className="bar-group">
              <div
                className="bar"
                style={{ height: "50%", opacity: 0.7 }}
              ></div>
              <div className="bar-label">Feb</div>
            </div>
            <div className="bar-group">
              <div
                className="bar"
                style={{ height: "75%", opacity: 1.0 }}
              ></div>
              <div className="bar-label">Mar</div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="cc-header">By Severity</div>
          <div className="donut-container">
            <div className="donut-chart">
              <div className="donut-inner"></div>
            </div>
          </div>
          <div className="donut-legend">
            <div className="dl-item">
              <div className="dl-left">
                <div
                  className="dl-dot"
                  style={{ background: "var(--coral)" }}
                ></div>
                <span>Critical</span>
              </div>
              <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                35%
              </span>
            </div>
            <div className="dl-item">
              <div className="dl-left">
                <div
                  className="dl-dot"
                  style={{ background: "var(--amber)" }}
                ></div>
                <span>High</span>
              </div>
              <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                25%
              </span>
            </div>
            <div className="dl-item">
              <div className="dl-left">
                <div
                  className="dl-dot"
                  style={{ background: "var(--teal)" }}
                ></div>
                <span>Medium</span>
              </div>
              <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                20%
              </span>
            </div>
            <div className="dl-item">
              <div className="dl-left">
                <div
                  className="dl-dot"
                  style={{ background: "var(--ink3)" }}
                ></div>
                <span>Low</span>
              </div>
              <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                20%
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="charts-grid" style={{ marginBottom: "24px" }}>
        {/* Advanced Widgets (Locked on Starter) */}
        <div style={{ position: "relative" }}>
          {planType === "starter" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(9, 9, 10, 0.4)",
                borderRadius: "12px",
                backdropFilter: "blur(6px)",
              }}
            >
              <div
                style={{
                  background: "var(--surface2)",
                  padding: "16px 24px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="var(--ink2)"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <div style={{ fontWeight: 600, color: "var(--ink)" }}>
                  Available on Team
                </div>
                <Link
                  href="/dashboard/settings"
                  style={{
                    fontSize: "13px",
                    color: "var(--teal2)",
                    textDecoration: "none",
                  }}
                >
                  Upgrade now →
                </Link>
              </div>
            </div>
          )}
          <div
            className="chart-card"
            style={{
              height: "100%",
              filter: planType === "starter" ? "blur(2px)" : "none",
            }}
          >
            <div className="cc-header">
              Regression Risk &mdash; March Release
            </div>
            <div style={{ marginTop: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--ink2)",
                    width: "80px",
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  Auth
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "8px",
                    background: "var(--surface3)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "var(--coral)",
                      width: "92%",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--ink3)",
                    width: "30px",
                    textAlign: "right",
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  92%
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--ink2)",
                    width: "80px",
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  Billing
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "8px",
                    background: "var(--surface3)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "var(--amber)",
                      width: "78%",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--ink3)",
                    width: "30px",
                    textAlign: "right",
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  78%
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--ink2)",
                    width: "80px",
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  Gateway
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "8px",
                    background: "var(--surface3)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "var(--teal)",
                      width: "65%",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--ink3)",
                    width: "30px",
                    textAlign: "right",
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  65%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          {planType === "starter" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(9, 9, 10, 0.4)",
                borderRadius: "12px",
                backdropFilter: "blur(6px)",
              }}
            >
              <div
                style={{
                  background: "var(--surface2)",
                  padding: "16px 24px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
              >
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="var(--ink2)"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <div style={{ fontWeight: 600, color: "var(--ink)" }}>
                  Available on Team
                </div>
                <Link
                  href="/dashboard/settings"
                  style={{
                    fontSize: "13px",
                    color: "var(--teal2)",
                    textDecoration: "none",
                  }}
                >
                  Upgrade now →
                </Link>
              </div>
            </div>
          )}
          <div
            className="chart-card"
            style={{
              height: "100%",
              filter: planType === "starter" ? "blur(2px)" : "none",
            }}
          >
            <div className="cc-header">Coverage Gaps</div>
            <div style={{ marginTop: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    width: "100px",
                    fontSize: "12px",
                    color: "var(--ink2)",
                  }}
                >
                  SSO Redirects
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "8px",
                    background: "var(--surface3)",
                    borderRadius: "4px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "var(--coral)",
                      width: "40%",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>
                <span
                  style={{
                    width: "40px",
                    textAlign: "right",
                    fontSize: "12px",
                    fontFamily: '"JetBrains Mono", monospace',
                    color: "var(--ink3)",
                  }}
                >
                  40%
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    width: "100px",
                    fontSize: "12px",
                    color: "var(--ink2)",
                  }}
                >
                  Bulk Export API
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "8px",
                    background: "var(--surface3)",
                    borderRadius: "4px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "var(--coral)",
                      width: "15%",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>
                <span
                  style={{
                    width: "40px",
                    textAlign: "right",
                    fontSize: "12px",
                    fontFamily: '"JetBrains Mono", monospace',
                    color: "var(--ink3)",
                  }}
                >
                  15%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="activity-card">
        <div className="cc-header" style={{ marginBottom: "16px" }}>
          Recent Activity
        </div>
        <div className="ac-list">
          <div className="ac-item">
            <div className="ac-dot coral"></div>
            <div className="ac-content">
              <div className="ac-text">
                AI automatically flagged a critical authentication flaw in{" "}
                <strong style={{ color: "var(--ink)" }}>PR-1025</strong>
              </div>
              <div className="ac-meta">10 minutes ago</div>
            </div>
          </div>
          <div className="ac-item">
            <div className="ac-dot"></div>
            <div className="ac-content">
              <div className="ac-text">
                User <strong>Alex Chen</strong> uploaded new dataset{" "}
                <em>"Q1_Regression_Results.csv"</em>
              </div>
              <div className="ac-meta">2 hours ago</div>
            </div>
          </div>
          <div className="ac-item">
            <div className="ac-dot amber"></div>
            <div className="ac-content">
              <div className="ac-text">
                Weekly automated risk report generated. 3 new medium risks
                identified in Billing module.
              </div>
              <div className="ac-meta">Yesterday at 4:32 PM</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
