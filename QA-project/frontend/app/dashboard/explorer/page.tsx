"use client";

import React, { useState, useMemo } from "react";
import { useBilling } from "../../contexts/BillingContext";

// Mock Data
type Defect = {
  id: string;
  title: string;
  module: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Closed";
  date: string;
  desc: string;
};

const MOCK_DEFECTS: Defect[] = [
  {
    id: "QA-1042",
    title: "Login fails on Safari",
    module: "Auth",
    severity: "Critical",
    status: "Open",
    date: "Mar 01, 2026",
    desc: "When entering valid credentials on iOS Safari (v17.3), the login button spins indefinitely. No network request is actually fired.",
  },
  {
    id: "QA-1041",
    title: "Data export timeout",
    module: "API",
    severity: "High",
    status: "In Progress",
    date: "Feb 28, 2026",
    desc: "Attempting to export a dataset larger than 50MB results in a 504 Gateway Timeout after 30 seconds.",
  },
  {
    id: "QA-1038",
    title: "Chart renders blank",
    module: "Dashboard",
    severity: "Medium",
    status: "Closed",
    date: "Feb 25, 2026",
    desc: "The severity donut chart renders as a blank gray circle if there is no data, rather than showing the empty state illustration.",
  },
  {
    id: "QA-1035",
    title: "OTP resend not working",
    module: "Auth",
    severity: "Critical",
    status: "Open",
    date: "Feb 22, 2026",
    desc: 'Clicking the "Resend Code" button on the 2FA screen triggers a silent console error and does not dispatch the email.',
  },
  {
    id: "QA-1029",
    title: "Typo in welcome email",
    module: "Onboarding",
    severity: "Low",
    status: "Closed",
    date: "Feb 18, 2026",
    desc: 'The welcome email says "Helo" instead of "Hello".',
  },
  {
    id: "QA-1025",
    title: "Missing trailing slash handling",
    module: "Routing",
    severity: "Medium",
    status: "In Progress",
    date: "Feb 15, 2026",
    desc: "Navigating to /dashboard/ causes a 404 instead of redirecting to /dashboard.",
  },
];

export default function ExplorerPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { planType } = useBilling();

  // Slide Panel State
  const [activeDefect, setActiveDefect] = useState<Defect | null>(null);

  const handleRowClick = (defect: Defect) => {
    setActiveDefect(defect);
  };

  const closePanel = () => {
    setActiveDefect(null);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredDefects.map((d) => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Filtering Logic
  const filteredDefects = useMemo(() => {
    return MOCK_DEFECTS.filter((d) => {
      const matchSearch =
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        d.module.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || d.status === statusFilter;
      const matchSeverity =
        severityFilter === "All" || d.severity === severityFilter;
      return matchSearch && matchStatus && matchSeverity;
    });
  }, [search, statusFilter, severityFilter]);

  const allSelected =
    filteredDefects.length > 0 && selectedIds.size === filteredDefects.length;

  const getSeverityBadge = (sev: string) => {
    if (sev === "Critical")
      return <span className="badge-critical">Critical</span>;
    if (sev === "High") return <span className="badge-high">High</span>;
    if (sev === "Medium") return <span className="badge-medium">Medium</span>;
    return <span className="badge-low">Low</span>;
  };

  const getStatusBadge = (status: string) => {
    if (status === "Open") return <span className="status-open">Open</span>;
    if (status === "In Progress")
      return <span className="status-progress">In Progress</span>;
    return <span className="status-closed">Closed</span>;
  };

  return (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Defect Explorer</h1>
        <div className="dash-header-actions">
          {planType === "starter" ? (
            <button
              className="dash-btn dash-btn-primary"
              style={{ opacity: 0.5, cursor: "not-allowed" }}
              title="Available on Team plan"
              onClick={() => alert("Upgrade to Team plan to export data.")}
            >
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ marginRight: "4px" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Export CSV
            </button>
          ) : (
            <button
              className="dash-btn dash-btn-primary"
              onClick={() => alert("Export mock trigger")}
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div
        className="dash-content"
        style={{
          padding: "0",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* TOOLBAR */}
        <div className="explorer-toolbar">
          <div className="et-search">
            <svg
              className="et-search-icon"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              className="et-search-input"
              placeholder="Search defects by title, ID, or module..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="et-filters hidden sm:flex">
            <select
              className="et-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
            <select
              className="et-filter-select"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="All">Severity</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select className="et-filter-select">
              <option value="All">Date</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>
                  <div className="cb-wrapper">
                    <input
                      type="checkbox"
                      className="cb-custom"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                    />
                  </div>
                </th>
                <th>Title</th>
                <th>Module</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDefects.length > 0 ? (
                filteredDefects.map((d) => (
                  <tr key={d.id} onClick={() => handleRowClick(d)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="cb-wrapper">
                        <input
                          type="checkbox"
                          className="cb-custom"
                          checked={selectedIds.has(d.id)}
                          onChange={() => {}}
                          onClick={(e) => toggleSelect(e, d.id)}
                        />
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{d.title}</div>
                      <div className="dt-id">{d.id}</div>
                    </td>
                    <td>
                      <span style={{ color: "var(--ink2)" }}>{d.module}</span>
                    </td>
                    <td>{getSeverityBadge(d.severity)}</td>
                    <td>{getStatusBadge(d.status)}</td>
                    <td>
                      <span
                        style={{
                          color: "var(--ink2)",
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: "11px",
                        }}
                      >
                        {d.date}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: "var(--ink3)" }}>•••</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: 0 }}>
                    <div className="empty-table animate-fade-in">
                      <div className="empty-table-icon">🕳️</div>
                      <h3
                        style={{
                          fontSize: "18px",
                          fontWeight: 500,
                          color: "var(--ink)",
                          marginBottom: "8px",
                        }}
                      >
                        No results found
                      </h3>
                      <p className="empty-table-text">
                        No defects match your current search constraints.
                      </p>
                      <button
                        className="dash-btn"
                        style={{
                          border: "1px solid var(--border)",
                          background: "var(--surface2)",
                          color: "var(--ink)",
                        }}
                        onClick={() => {
                          setSearch("");
                          setStatusFilter("All");
                          setSeverityFilter("All");
                        }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT SLIDE-IN PANEL */}
      <div
        className={`panel-overlay ${activeDefect ? "open" : ""}`}
        onClick={closePanel}
      ></div>
      <div className={`slide-panel ${activeDefect ? "open" : ""}`}>
        {activeDefect && (
          <>
            <div className="sp-header">
              <div className="sp-title-wrap">
                <div className="sp-id">{activeDefect.id}</div>
                <h2 className="sp-title">{activeDefect.title}</h2>
              </div>
              <button className="sp-close" onClick={closePanel}>
                ✕
              </button>
            </div>

            <div className="sp-body">
              <div className="sp-meta-grid">
                <div className="sp-meta-block">
                  <span className="sp-meta-label">Status</span>
                  <div className="sp-meta-value">
                    {getStatusBadge(activeDefect.status)}
                  </div>
                </div>
                <div className="sp-meta-block">
                  <span className="sp-meta-label">Severity</span>
                  <div className="sp-meta-value">
                    {getSeverityBadge(activeDefect.severity)}
                  </div>
                </div>
                <div className="sp-meta-block">
                  <span className="sp-meta-label">Module / Area</span>
                  <div className="sp-meta-value" style={{ fontWeight: 500 }}>
                    {activeDefect.module}
                  </div>
                </div>
                <div className="sp-meta-block">
                  <span className="sp-meta-label">Reported Date</span>
                  <div
                    className="sp-meta-value"
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: "12px",
                      color: "var(--ink2)",
                    }}
                  >
                    {activeDefect.date}
                  </div>
                </div>
              </div>

              <div className="sp-desc-block">
                <h4>Description</h4>
                <div className="sp-desc-content">{activeDefect.desc}</div>
              </div>

              <div className="sp-comments-block">
                <h4>Activity &amp; Comments</h4>
                <div className="sp-comment">
                  <div className="sp-avatar">S</div>
                  <div className="sp-comment-body">
                    <div className="sp-comment-meta">
                      <span className="sp-comment-author">System AI</span>
                      <span className="sp-comment-time">10 mins ago</span>
                    </div>
                    <div className="sp-comment-text">
                      Auto-triaged based on similar historical issues. Flagged
                      as {activeDefect.severity} priority.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "24px 32px",
                borderTop: "1px solid var(--border)",
                background: "var(--surface2)",
                display: "flex",
                gap: "16px",
              }}
            >
              <button
                className="dash-btn dash-btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
              >
                Edit Defect
              </button>
              <button
                className="dash-btn"
                style={{
                  flex: 1,
                  justifyContent: "center",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--ink2)",
                }}
                onClick={closePanel}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
