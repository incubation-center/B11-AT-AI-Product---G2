import React from "react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="hero" style={{ paddingTop: "120px" }}>
      <div className="hero-grid"></div>

      <div className="hero-badge">
        <div className="badge-dot"></div>
        RAG-powered &middot; No hallucinations &middot; Project-specific
        intelligence
      </div>

      <h1 className="hero-title">
        Stop guessing
        <br />
        which bugs will
        <br />
        <em>break your release.</em>
      </h1>
      <div
        className="hero-title-2"
        style={{
          fontSize: "clamp(20px,3vw,36px)",
          marginBottom: "28px",
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 300,
          letterSpacing: "-0.5px",
        }}
      ></div>

      <p className="hero-desc">
        AI QA Defect Intelligence analyzes your historical bug data to predict
        regression risks, detect test gaps, and surface recurring defect
        patterns &mdash; before they reach production.
      </p>

      <div className="hero-actions">
        <Link href="/signup" className="btn-hero">
          Start free 14-day trial <span>&rarr;</span>
        </Link>
        <a href="#demo" className="btn-hero-outline">
          See it in action
        </a>
      </div>

      <div className="hero-trust">
        <span>No credit card required</span>
        <div className="trust-divider"></div>
        <span>Upload from Jira or GitHub</span>
        <div className="trust-divider"></div>
        <span>Setup in under 5 minutes</span>
      </div>

      {/* Dashboard Mockup */}
      <div className="hero-mockup" style={{ marginTop: "60px" }}>
        <div className="mockup-bar">
          <div className="mock-dot" style={{ background: "#FF5F57" }}></div>
          <div className="mock-dot" style={{ background: "#FEBC2E" }}></div>
          <div className="mock-dot" style={{ background: "#28C840" }}></div>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,.06)",
                borderRadius: "4px",
                padding: "3px 16px",
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: "10px",
                color: "var(--ink3)",
              }}
            >
              app.qaintelligence.io/dashboard
            </div>
          </div>
        </div>
        <div className="mockup-content">
          <div className="mock-sidebar">
            <div className="mock-sl">Navigation</div>
            <div className="mock-nav a">
              <span className="mock-ni flex items-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18" />
                  <path d="M18 17V9" />
                  <path d="M13 17V5" />
                  <path d="M8 17v-3" />
                </svg>
              </span>
              Dashboard
            </div>
            <div className="mock-nav">
              <span className="mock-ni flex items-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                </svg>
              </span>
              Upload
            </div>
            <div className="mock-nav">
              <span className="mock-ni flex items-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </span>
              Explorer
            </div>
            <div className="mock-nav">
              <span className="mock-ni flex items-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <path d="M12 12v.01" />
                  <path d="M8 12v.01" />
                  <path d="M16 12v.01" />
                </svg>
              </span>
              AI Chat
            </div>
            <div className="mock-nav">
              <span className="mock-ni flex items-center">
                <svg
                  width="14"
                  height="14"
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
              </span>
              Reports
            </div>
            <div style={{ marginTop: "auto", paddingTop: "20px" }}>
              <div className="mock-nav" style={{ marginTop: "4px" }}>
                <span className="mock-ni flex items-center">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </span>
                Settings
              </div>
            </div>
          </div>
          <div className="mock-main">
            <div className="mock-topbar">
              <div className="mock-title">Dashboard</div>
              <div
                style={{ display: "flex", gap: "6px", alignItems: "center" }}
              >
                <div style={{ fontSize: "10px", color: "var(--ink3)" }}>
                  Last 30 days ▾
                </div>
                <div
                  style={{
                    padding: "4px 10px",
                    background: "var(--teal)",
                    color: "#fff",
                    borderRadius: "4px",
                    fontSize: "9px",
                    cursor: "pointer",
                  }}
                >
                  + Upload
                </div>
              </div>
            </div>
            <div className="mock-metric-row">
              <div className="mock-metric">
                <div className="mm-label">TOTAL DEFECTS</div>
                <div className="mm-val">1,284</div>
                <div className="mm-delta" style={{ color: "var(--teal2)" }}>
                  &uarr; 12%
                </div>
              </div>
              <div className="mock-metric">
                <div className="mm-label">OPEN</div>
                <div className="mm-val" style={{ color: "var(--coral)" }}>
                  342
                </div>
                <div className="mm-delta" style={{ color: "var(--green)" }}>
                  &darr; 8%
                </div>
              </div>
              <div className="mock-metric">
                <div className="mm-label">CLOSED</div>
                <div className="mm-val" style={{ color: "var(--green)" }}>
                  891
                </div>
                <div className="mm-delta" style={{ color: "var(--teal2)" }}>
                  &uarr; 5%
                </div>
              </div>
              <div className="mock-metric">
                <div className="mm-label">CRITICAL</div>
                <div className="mm-val" style={{ color: "var(--amber)" }}>
                  51
                </div>
                <div className="mm-delta" style={{ color: "var(--coral)" }}>
                  &uarr; 3
                </div>
              </div>
            </div>
            <div className="mock-charts">
              <div className="mock-chart-box">
                <div className="mc-label">DEFECT TREND &mdash; 6 MONTHS</div>
                <div className="mc-bars">
                  <div
                    className="mc-bar"
                    style={{
                      height: "50%",
                      background: "var(--teal)",
                      opacity: 0.4,
                    }}
                  ></div>
                  <div
                    className="mc-bar"
                    style={{
                      height: "65%",
                      background: "var(--teal)",
                      opacity: 0.5,
                    }}
                  ></div>
                  <div
                    className="mc-bar"
                    style={{
                      height: "42%",
                      background: "var(--teal)",
                      opacity: 0.4,
                    }}
                  ></div>
                  <div
                    className="mc-bar"
                    style={{
                      height: "78%",
                      background: "var(--teal)",
                      opacity: 0.6,
                    }}
                  ></div>
                  <div
                    className="mc-bar"
                    style={{
                      height: "60%",
                      background: "var(--teal)",
                      opacity: 0.7,
                    }}
                  ></div>
                  <div
                    className="mc-bar"
                    style={{ height: "95%", background: "var(--teal)" }}
                  ></div>
                </div>
              </div>
              <div className="mock-chart-box">
                <div className="mc-label">BY SEVERITY</div>
                <div className="mc-donut"></div>
                <div className="mc-legend">
                  <div className="ml-row">
                    <div
                      className="ml-dot"
                      style={{ background: "var(--coral)" }}
                    ></div>
                    Critical 35%
                  </div>
                  <div className="ml-row">
                    <div
                      className="ml-dot"
                      style={{ background: "var(--amber)" }}
                    ></div>
                    High 23%
                  </div>
                  <div className="ml-row">
                    <div
                      className="ml-dot"
                      style={{ background: "var(--teal)" }}
                    ></div>
                    Medium 20%
                  </div>
                </div>
              </div>
            </div>
            <div className="mock-chat-teaser">
              <div className="mct-label flex items-center gap-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <path d="M12 12v.01" />
                  <path d="M8 12v.01" />
                  <path d="M16 12v.01" />
                </svg>{" "}
                AI Assistant
              </div>
              <div className="mct-msg u">
                &quot;What bugs usually appear after login module changes?&quot;
              </div>
              <div className="mct-msg ai">
                Based on 284 historical defects, here are the most common
                patterns:
                <div className="mct-result">
                  <div className="mct-ri flex items-center gap-1">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 3v18h18" />
                      <path d="M18 17V9" />
                      <path d="M13 17V5" />
                      <path d="M8 17v-3" />
                    </svg>{" "}
                    Bug Patterns &mdash; Login Module
                  </div>
                  <div className="mct-bar-row">
                    <span className="mct-lbl">Session expire</span>
                    <div className="mct-bar">
                      <div className="mct-fill" style={{ width: "78%" }}></div>
                    </div>
                    <span className="mct-pct">78%</span>
                  </div>
                  <div className="mct-bar-row">
                    <span className="mct-lbl">OAuth token</span>
                    <div className="mct-bar">
                      <div className="mct-fill" style={{ width: "64%" }}></div>
                    </div>
                    <span className="mct-pct">64%</span>
                  </div>
                  <div className="mct-bar-row">
                    <span className="mct-lbl">OTP timeout</span>
                    <div className="mct-bar">
                      <div className="mct-fill" style={{ width: "51%" }}></div>
                    </div>
                    <span className="mct-pct">51%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
