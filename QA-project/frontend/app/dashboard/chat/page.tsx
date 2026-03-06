"use client";

import React, { useState, useRef } from "react";
import { useBilling } from "../../contexts/BillingContext";

type ChatId = "new" | "login" | "march" | "coverage";

export default function ChatPage() {
  const [inputVal, setInputVal] = useState("");
  const [activeChat, setActiveChat] = useState<ChatId>("login");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { planType, usage } = useBilling();

  const queriesRemaining =
    planType === "starter" ? Math.max(0, 20 - usage.aiQueriesUsed) : Infinity;
  const isQueryLimitReached = planType === "starter" && queriesRemaining === 0;

  const CHA_HISTORY = [
    {
      id: "login",
      title: "Login module analysis",
      icon: (
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
      ),
    },
    {
      id: "march",
      title: "March regression risk",
      icon: (
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
      ),
    },
    {
      id: "coverage",
      title: "Coverage gaps report",
      icon: (
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
      ),
    },
  ];

  const renderActiveChat = () => {
    if (activeChat === "new") {
      return (
        <div className="ai-chat-area" style={{ justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: "var(--ink)" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "24px",
                color: "var(--teal)",
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.8 }}
              >
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                <path d="M5 3v4" />
                <path d="M19 17v4" />
                <path d="M3 5h4" />
                <path d="M17 19h4" />
              </svg>
            </div>
            <h2
              style={{ fontSize: "24px", fontWeight: 500, marginBottom: "8px" }}
            >
              How can I help you today?
            </h2>
            <p style={{ color: "var(--ink2)", fontSize: "15px" }}>
              Ask about defects, regressions, or system coverage.
            </p>
          </div>
        </div>
      );
    }

    if (activeChat === "march") {
      return (
        <div className="ai-chat-area">
          <div className="ai-msg-container">
            <div className="ai-msg user animate-fade-in">
              <div className="ai-msg-avatar">U</div>
              <div className="ai-msg-content">
                <div className="ai-msg-author">You</div>
                <div>
                  What are the top 3 riskiest modules before our March release?
                </div>
              </div>
            </div>

            <div
              className="ai-msg bot animate-fade-in"
              style={{ animationDelay: "0.2s", animationFillMode: "both" }}
            >
              <div className="ai-msg-avatar">
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
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
              </div>
              <div className="ai-msg-content">
                <div className="ai-msg-author">QA Intel</div>
                <div>
                  <p style={{ marginBottom: "16px" }}>
                    Based on your last 6 months of defect data, here are the
                    highest-risk modules:
                  </p>
                  <div
                    style={{
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "16px",
                      color: "var(--ink)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--ink)",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--coral)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      Regression Risk &mdash; March Release
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "12px",
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
                        marginBottom: "12px",
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
                        marginBottom: "20px",
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
                        API Gateway
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

                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--ink3)",
                        borderTop: "1px solid var(--border)",
                        paddingTop: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      Source: Dataset #3 &middot; 1,284 defects &middot; Jan–Mar
                      2025
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeChat === "coverage") {
      return (
        <div className="ai-chat-area">
          <div className="ai-msg-container">
            <div className="ai-msg user animate-fade-in">
              <div className="ai-msg-avatar">U</div>
              <div className="ai-msg-content">
                <div className="ai-msg-author">You</div>
                <div>Can you show me our current test coverage gaps?</div>
              </div>
            </div>

            <div
              className="ai-msg bot animate-fade-in"
              style={{ animationDelay: "0.2s", animationFillMode: "both" }}
            >
              <div className="ai-msg-avatar">
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
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
              </div>
              <div className="ai-msg-content">
                <div className="ai-msg-author">QA Intel</div>
                <div>
                  <p>
                    I found three major coverage gaps in the latest test run
                    linked to recent feature additions:
                  </p>
                  <div className="ai-data-card">
                    <div className="adc-header flex items-center gap-2">
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
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                      Missing E2E Tests
                    </div>
                    <div className="adc-row">
                      <span className="adc-label">SSO Redirects</span>
                      <div className="adc-bar-wrap">
                        <div
                          className="adc-bar"
                          style={{ width: "40%", background: "var(--coral)" }}
                        ></div>
                      </div>
                      <span className="adc-val">40%</span>
                    </div>
                    <div className="adc-row">
                      <span className="adc-label">Bulk Export API</span>
                      <div className="adc-bar-wrap">
                        <div
                          className="adc-bar"
                          style={{ width: "15%", background: "var(--coral)" }}
                        ></div>
                      </div>
                      <span className="adc-val">15%</span>
                    </div>
                    <div className="adc-source">
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      Source: Coverage Tooling API &middot; Mar 05 2026
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default to 'login'
    return (
      <div className="ai-chat-area">
        <div className="ai-msg-container">
          <div className="ai-msg user animate-fade-in">
            <div className="ai-msg-avatar">U</div>
            <div className="ai-msg-content">
              <div className="ai-msg-author">You</div>
              <div>What bugs usually appear after login module changes?</div>
            </div>
          </div>

          <div
            className="ai-msg bot animate-fade-in"
            style={{ animationDelay: "0.2s", animationFillMode: "both" }}
          >
            <div className="ai-msg-avatar">
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
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
            </div>
            <div className="ai-msg-content">
              <div className="ai-msg-author">QA Intel</div>
              <div>
                <p>
                  Based on 284 historical defects in your dataset, here are the
                  most common bugs triggered after login module changes:
                </p>

                <div className="ai-data-card">
                  <div className="adc-header flex items-center gap-2">
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
                      <path d="M3 3v18h18" />
                      <path d="M18 17V9" />
                      <path d="M13 17V5" />
                      <path d="M8 17v-3" />
                    </svg>
                    Recurring Bug Patterns — Login Module
                  </div>

                  <div className="adc-row">
                    <span className="adc-label">Session expire</span>
                    <div className="adc-bar-wrap">
                      <div className="adc-bar" style={{ width: "78%" }}></div>
                    </div>
                    <span className="adc-val">78%</span>
                  </div>

                  <div className="adc-row">
                    <span className="adc-label">OAuth token</span>
                    <div className="adc-bar-wrap">
                      <div className="adc-bar" style={{ width: "64%" }}></div>
                    </div>
                    <span className="adc-val">64%</span>
                  </div>

                  <div className="adc-row">
                    <span className="adc-label">OTP timeout</span>
                    <div className="adc-bar-wrap">
                      <div className="adc-bar" style={{ width: "51%" }}></div>
                    </div>
                    <span className="adc-val">51%</span>
                  </div>

                  <div className="adc-row">
                    <span className="adc-label">Safari compat</span>
                    <div className="adc-bar-wrap">
                      <div className="adc-bar" style={{ width: "38%" }}></div>
                    </div>
                    <span className="adc-val">38%</span>
                  </div>

                  <div className="adc-source">
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Source: Dataset #2 &middot; 284 records &middot; Mar 2025
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="dash-header">
        <h1 className="dash-title">AI Assistant</h1>
        <div className="dash-header-actions">
          {planType === "starter" && (
            <span
              style={{
                fontSize: "12px",
                background: "var(--surface2)",
                padding: "6px 12px",
                borderRadius: "100px",
                border: "1px solid var(--border)",
                color: isQueryLimitReached ? "var(--coral)" : "var(--ink)",
              }}
            >
              {usage.aiQueriesUsed} / 20 queries used
            </span>
          )}
          <span className="dash-date">Dataset: Last 6 Months</span>
        </div>
      </div>

      <div className="ai-split">
        {/* SIDEBAR */}
        <div className="ai-sidebar">
          <div className="ai-history-title">Conversations</div>
          {CHA_HISTORY.map((chat) => (
            <div
              key={chat.id}
              className={`ai-hist-item ${activeChat === chat.id ? "active" : ""}`}
              onClick={() => setActiveChat(chat.id as ChatId)}
            >
              <span className="ai-hist-icon">{chat.icon}</span> {chat.title}
            </div>
          ))}

          <div className="ai-sidebar-bottom">
            <button
              className={`dash-btn ai-btn-new ${activeChat === "new" ? "active" : ""}`}
              onClick={() => setActiveChat("new")}
            >
              + New Chat
            </button>
          </div>
        </div>

        {/* MAIN CHAT */}
        <div className="ai-main">
          {/* Dynamic Area */}
          {renderActiveChat()}

          {/* INPUT AREA */}
          <div className="ai-input-wrap">
            <div className="ai-input-container">
              <div
                className="ai-input-box"
                style={{
                  opacity: isQueryLimitReached ? 0.6 : 1,
                  pointerEvents: isQueryLimitReached ? "none" : "auto",
                }}
              >
                <textarea
                  className="ai-textarea"
                  placeholder={
                    isQueryLimitReached
                      ? "Monthly AI query limit reached. Upgrade to continue."
                      : "Ask about defects, patterns, risks, coverage gaps..."
                  }
                  value={inputVal}
                  disabled={isQueryLimitReached}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (inputVal.trim() !== "") setInputVal("");
                    }
                  }}
                />

                {/* TOOLBAR */}
                <div className="ai-input-toolbar">
                  <div className="ai-toolbar-left">
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                    />
                    <button
                      className="ai-icon-btn"
                      title="Attach file"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="ai-toolbar-right">
                    <button className="ai-icon-btn">
                      <svg
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                    </button>
                    <button
                      className="ai-send"
                      onClick={() => {
                        if (inputVal.trim() !== "") setInputVal("");
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ transform: "rotate(0deg)" }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
