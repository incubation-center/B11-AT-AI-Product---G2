"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BillingProvider, useBilling } from "../contexts/BillingContext";
import "./dashboard.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <BillingProvider>
      <div className="dashboard-root">
        <aside className="dash-sidebar">
          <Link href="/dashboard" className="dash-logo">
            <div className="dash-logo-mark">Q</div>
            QA Intel
          </Link>

          <nav className="dash-nav">
            <Link
              href="/dashboard"
              className={`dash-nav-item ${pathname === "/dashboard" ? "active" : ""}`}
            >
              <span className="dash-nav-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                  <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                  <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                </svg>
              </span>
              Dashboard
            </Link>
            <Link
              href="/dashboard/upload"
              className={`dash-nav-item ${pathname === "/dashboard/upload" ? "active" : ""}`}
            >
              <span className="dash-nav-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </span>
              Upload Data
            </Link>
            <Link
              href="/dashboard/explorer"
              className={`dash-nav-item ${pathname === "/dashboard/explorer" ? "active" : ""}`}
            >
              <span className="dash-nav-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              Explorer
            </Link>
            <Link
              href="/dashboard/chat"
              className={`dash-nav-item ${pathname === "/dashboard/chat" ? "active" : ""}`}
            >
              <span className="dash-nav-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </span>
              AI Chat
            </Link>
            <Link
              href="/dashboard/reports"
              className={`dash-nav-item ${pathname === "/dashboard/reports" ? "active" : ""}`}
            >
              <span className="dash-nav-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18"></path>
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
                </svg>
              </span>
              Reports
            </Link>
          </nav>

          <div className="dash-bottom-nav">
            <Link
              href="/dashboard/settings"
              className={`dash-nav-item ${pathname === "/dashboard/settings" ? "active" : ""}`}
            >
              <span className="dash-nav-icon">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </span>
              Settings
            </Link>
          </div>
        </aside>

        <main className="dash-main">
          <GlobalBillingWarnings />
          {children}
        </main>
      </div>
    </BillingProvider>
  );
}

function GlobalBillingWarnings() {
  const { planType, setPlanType } = useBilling();

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "10px 16px",
        display: "flex",
        gap: "16px",
        zIndex: 9999,
        alignItems: "center",
      }}
    >
      <div style={{ fontSize: "12px", color: "var(--ink2)" }}>
        Testing role:{" "}
        <strong style={{ color: "var(--ink)" }}>
          {planType.toUpperCase()}
        </strong>
      </div>
      <button
        className="dash-btn"
        style={{
          padding: "6px 12px",
          fontSize: "11px",
          background: "var(--hover)",
          color: "var(--ink)",
        }}
        onClick={() => setPlanType(planType === "starter" ? "team" : "starter")}
      >
        Toggle Role
      </button>
    </div>
  );
}
