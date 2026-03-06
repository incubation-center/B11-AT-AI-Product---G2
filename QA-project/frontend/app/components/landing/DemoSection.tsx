import React from "react";

export function DemoSection() {
  return (
    <section className="demo-section" id="demo">
      <div className="demo-inner">
        <div className="demo-chat-window">
          <div className="dcw-bar">
            <div className="dcw-dot" style={{ background: "#FF5F57" }}></div>
            <div className="dcw-dot" style={{ background: "#FEBC2E" }}></div>
            <div className="dcw-dot" style={{ background: "#28C840" }}></div>
            <div className="dcw-title">AI Chat &mdash; QA Intelligence</div>
          </div>
          <div className="dcw-body">
            <div className="chat-msg u">
              <div className="cm-bub">
                What are the top 3 riskiest modules before our March release?
              </div>
            </div>
            <div className="chat-msg ai">
              <div className="cm-bub">
                Based on your last 6 months of defect data, here are the
                highest-risk modules:
                <div className="chat-result">
                  <div className="cr-title flex items-center gap-1.5">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-red-500"
                    >
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    Regression Risk &mdash; March Release
                  </div>
                  <div className="cr-row">
                    <span className="cr-lbl">Auth</span>
                    <div className="cr-bar">
                      <div className="cr-fill" style={{ width: "92%" }}></div>
                    </div>
                    <span className="cr-pct">92%</span>
                  </div>
                  <div className="cr-row">
                    <span className="cr-lbl">Billing</span>
                    <div className="cr-bar">
                      <div className="cr-fill" style={{ width: "78%" }}></div>
                    </div>
                    <span className="cr-pct">78%</span>
                  </div>
                  <div className="cr-row">
                    <span className="cr-lbl">API Gateway</span>
                    <div className="cr-bar">
                      <div className="cr-fill" style={{ width: "65%" }}></div>
                    </div>
                    <span className="cr-pct">65%</span>
                  </div>
                  <div className="cr-cite flex items-center gap-1.5">
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
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    Source: Dataset #3 &middot; 1,284 defects &middot; Jan–Mar
                    2025
                  </div>
                </div>
              </div>
            </div>
            <div className="chat-msg u">
              <div className="cm-bub">Why is Auth so risky?</div>
            </div>
            <div className="chat-msg ai">
              <div className="cm-bub">
                Auth has 47 defects in the last 90 days &mdash; 31% are
                recurring patterns. The top recurring issues are session expiry
                edge cases (18 occurrences) and OAuth token refresh failures (12
                occurrences). Your test suite currently covers only 23% of these
                historically buggy code paths.
              </div>
            </div>
          </div>
          <div className="dcw-input">
            <div className="dcw-inp">
              Ask about your defects, risks, or patterns...
            </div>
            <button className="dcw-send">&rarr;</button>
          </div>
        </div>

        <div className="demo-copy">
          <span className="section-eyebrow">AI QA Assistant</span>
          <h2
            className="section-title"
            style={{ fontSize: "clamp(30px,3vw,46px)" }}
          >
            Ask anything.
            <br />
            <em>Get real answers.</em>
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "var(--ink2)",
              lineHeight: 1.7,
              marginBottom: "32px",
            }}
          >
            Unlike generic AI tools, QA Intelligence only answers from your
            actual defect history. Every response comes with source citations
            showing exactly which dataset and records it referenced.
          </p>
          <div className="demo-queries">
            <div className="dq-item">
              <div className="dq-icon flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-500"
                >
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div>
                <div className="dq-q">
                  &quot;What bugs usually appear after login refactoring?&quot;
                </div>
                <div className="dq-a">
                  Pattern analysis across your full defect history
                </div>
              </div>
            </div>
            <div className="dq-item">
              <div className="dq-icon flex items-center justify-center">
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
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div>
                <div className="dq-q">
                  &quot;Which modules are at risk in the next release?&quot;
                </div>
                <div className="dq-a">
                  Regression risk score based on change history + defect
                  patterns
                </div>
              </div>
            </div>
            <div className="dq-item">
              <div className="dq-icon flex items-center justify-center">
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
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>
              <div>
                <div className="dq-q">
                  &quot;Where are our test coverage gaps?&quot;
                </div>
                <div className="dq-a">
                  Cross-references defects against your test case documents
                </div>
              </div>
            </div>
            <div className="dq-item">
              <div className="dq-icon flex items-center justify-center">
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
                  <path d="M3 3v18h18" />
                  <path d="M18 17V9" />
                  <path d="M13 17V5" />
                  <path d="M8 17v-3" />
                </svg>
              </div>
              <div>
                <div className="dq-q">
                  &quot;Show me all critical open bugs in the Auth module&quot;
                </div>
                <div className="dq-a">
                  Returns a live data table with export and deep-link to
                  Explorer
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
