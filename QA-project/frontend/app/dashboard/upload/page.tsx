"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBilling } from "../../contexts/BillingContext";

export default function UploadPage() {
  // Navigation and State
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { planType, usage } = useBilling();

  const isLockedOut = planType === "starter" && usage.datasetsCount >= 1;
  const isNearingDefectLimit =
    planType === "starter" && usage.totalDefects >= 450;
  const defectPercentage = Math.min(100, (usage.totalDefects / 500) * 100);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Column Mapping State
  const [mappings, setMappings] = useState({
    bug_id: "System ID",
    summary: "Defect Title",
    severity_lvl: "Severity Level",
    component: "Tags", // Initially 'wrong' to show interactivity
  });

  const handleMappingChange = (key: string, val: string) => {
    setMappings((prev) => ({ ...prev, [key]: val }));
  };

  // Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    // If files were dropped, trigger parsing
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      startParsing();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      startParsing();
    }
  };

  const startParsing = () => {
    setIsParsing(true);
    setTimeout(() => {
      setIsParsing(false);
      setStep(2);
    }, 1500); // Simulate network delay
  };

  const handleImport = () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      setStep(3);
    }, 2000);
  };

  return (
    <div className="upload-wizard">
      <div
        className="dash-header"
        style={{
          marginBottom: "40px",
          borderBottom: "none",
          padding: "0",
          justifyContent: "center",
        }}
      >
        <h1 className="dash-title" style={{ fontSize: "32px" }}>
          Upload Data
        </h1>
      </div>

      <div className="wizard-steps">
        <div
          className={`w-step ${step >= 1 ? (step > 1 ? "done" : "active") : ""}`}
        >
          <div className="ws-num">{step > 1 ? "✓" : "1"}</div>
          <span>Select File</span>
        </div>
        <div className={`ws-line ${step > 1 ? "done" : ""}`}></div>
        <div
          className={`w-step ${step >= 2 ? (step > 2 ? "done" : "active") : ""}`}
        >
          <div className="ws-num">{step > 2 ? "✓" : "2"}</div>
          <span>Map Columns</span>
        </div>
        <div className={`ws-line ${step > 2 ? "done" : ""}`}></div>
        <div className={`w-step ${step === 3 ? "done" : "pending"}`}>
          <div className="ws-num">{step === 3 ? "✓" : "3"}</div>
          <span>Import</span>
        </div>
      </div>

      <div
        className="dash-content"
        style={{ padding: "0", maxWidth: "800px", margin: "0 auto" }}
      >
        {/* STEP 1: DROP ZONE */}
        {step === 1 && (
          <div className="step-content animate-fade-in">
            {isParsing ? (
              <div className="parsing-state">
                <div className="spinner"></div>
                <h3>Reading File Details...</h3>
                <p>Analyzing columns and data types using AI</p>
              </div>
            ) : (
              <>
                <div
                  className={`drop-zone ${isDragging ? "drag-active" : ""} ${isLockedOut ? "drop-zone-locked" : ""}`}
                  onDragOver={isLockedOut ? undefined : handleDragOver}
                  onDragLeave={isLockedOut ? undefined : handleDragLeave}
                  onDrop={isLockedOut ? undefined : handleDrop}
                  onClick={() => !isLockedOut && fileInputRef.current?.click()}
                  style={{
                    opacity: isLockedOut ? 0.6 : 1,
                    cursor: isLockedOut ? "not-allowed" : "pointer",
                  }}
                >
                  <div className="dz-icon-wrap">
                    <svg
                      className="dz-icon-svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <h2 className="dz-title">Drag & drop your dataset</h2>
                  <p className="dz-desc">
                    Supports CSV, XLSX, and JSON formatted bug exports.
                  </p>

                  <div className="dz-limits">
                    <span>File size limit: 50MB</span>
                    <span className="dot hidden sm:inline">&middot;</span>
                    <span>
                      Max{" "}
                      {planType === "starter"
                        ? "rows: 500 (Free)"
                        : "rows: 100,000"}
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".csv, .xlsx, .json"
                    style={{ display: "none" }}
                  />

                  <button
                    className="dash-btn dash-btn-primary dz-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={isLockedOut}
                  >
                    {isLockedOut ? "Limit Reached" : "Browse Files"}
                  </button>
                </div>

                {planType === "starter" && (
                  <div
                    className="usage-wrap"
                    style={{ marginTop: "24px", padding: "0 24px" }}
                  >
                    <div className="usage-header">
                      <span>Starter Defect Limit</span>
                      <span
                        style={{ fontFamily: '"JetBrains Mono", monospace' }}
                      >
                        {usage.totalDefects} / 500 rows
                      </span>
                    </div>
                    <div className="usage-bar-bg">
                      <div
                        className="usage-bar-fill"
                        style={{
                          width: `${defectPercentage}%`,
                          background: isNearingDefectLimit
                            ? "var(--coral)"
                            : "var(--amber)",
                        }}
                      ></div>
                    </div>
                    {isLockedOut && (
                      <div
                        style={{
                          marginTop: "16px",
                          background: "rgba(232, 147, 10, 0.1)",
                          border: "1px solid var(--amber)",
                          padding: "16px",
                          borderRadius: "8px",
                          color: "var(--ink)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "var(--amber)",
                            marginBottom: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
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
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          Upgrade Required
                        </div>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "var(--ink2)",
                            marginBottom: "16px",
                          }}
                        >
                          You have reached your 1 dataset limit on the Starter
                          plan. Upgrade to Team to import more datasets and gain
                          unlimited defect tracking.
                        </p>
                        <Link
                          href="/dashboard/settings"
                          className="dash-btn"
                          style={{ background: "var(--amber)", color: "#000" }}
                        >
                          Upgrade to Team →
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div className="upload-history list-card">
                  <div className="lc-header">
                    <h3 className="lc-title">Recent Uploads</h3>
                  </div>
                  <div className="uh-list">
                    <div className="uh-item">
                      <div className="uhi-left">
                        <div className="uhi-icon db-icon">🗃️</div>
                        <div>
                          <div className="uhi-name">Q4_Defect_Export.csv</div>
                          <div className="uhi-meta">
                            142 KB &middot; Mar 1, 2026 at 10:24 AM
                          </div>
                        </div>
                      </div>
                      <div className="uhi-status indexed">Indexed</div>
                    </div>
                    <div className="uh-item">
                      <div className="uhi-left">
                        <div className="uhi-icon db-icon">🗃️</div>
                        <div>
                          <div className="uhi-name">jira_bugs_jan.xlsx</div>
                          <div className="uhi-meta">
                            2.4 MB &middot; Jan 15, 2026 at 2:05 PM
                          </div>
                        </div>
                      </div>
                      <div className="uhi-status indexed">Indexed</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 2: MAPPING */}
        {step === 2 && (
          <div className="step-content animate-fade-in">
            {isImporting ? (
              <div className="parsing-state">
                <div className="spinner"></div>
                <h3>Importing Data...</h3>
                <p>Mapping properties and indexing for AI search</p>
              </div>
            ) : (
              <>
                <div className="mapping-card">
                  <div className="mc-top">
                    <div>
                      <h3 className="mc-title">Review Column Mapping</h3>
                      <p className="mc-desc">
                        We automatically matched your file columns to the system
                        fields. Please verify.
                      </p>
                    </div>
                    <div className="mc-badge">4 Columns Detected</div>
                  </div>

                  <div className="mc-body">
                    <div className="map-list">
                      <div className="map-row-unified">
                        <div className="mru-file">
                          <span className="mru-icon">#</span>
                          <span className="mru-name">bug_id</span>
                        </div>
                        <div className="mru-connect">
                          <div className="mru-line"></div>
                          <svg
                            className="mru-arrow"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </div>
                        <div className="mru-sys">
                          <select
                            className="map-select"
                            value={mappings.bug_id}
                            onChange={(e) =>
                              handleMappingChange("bug_id", e.target.value)
                            }
                          >
                            <option value="System ID">System ID *</option>
                            <option value="Defect Title">Defect Title *</option>
                          </select>
                        </div>
                      </div>

                      <div className="map-row-unified">
                        <div className="mru-file">
                          <span className="mru-icon">Aa</span>
                          <span className="mru-name">summary</span>
                        </div>
                        <div className="mru-connect">
                          <div className="mru-line"></div>
                          <svg
                            className="mru-arrow"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </div>
                        <div className="mru-sys">
                          <select
                            className="map-select"
                            value={mappings.summary}
                            onChange={(e) =>
                              handleMappingChange("summary", e.target.value)
                            }
                          >
                            <option value="System ID">System ID *</option>
                            <option value="Defect Title">Defect Title *</option>
                            <option value="Description">Description</option>
                          </select>
                        </div>
                      </div>

                      <div className="map-row-unified">
                        <div className="mru-file">
                          <span className="mru-icon">⚡</span>
                          <span className="mru-name">severity_lvl</span>
                        </div>
                        <div className="mru-connect">
                          <div className="mru-line"></div>
                          <svg
                            className="mru-arrow"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </div>
                        <div className="mru-sys">
                          <select
                            className="map-select"
                            value={mappings.severity_lvl}
                            onChange={(e) =>
                              handleMappingChange(
                                "severity_lvl",
                                e.target.value,
                              )
                            }
                          >
                            <option value="Severity Level">
                              Severity Level
                            </option>
                            <option value="Priority">Priority</option>
                          </select>
                        </div>
                      </div>

                      <div className="map-row-unified">
                        <div className="mru-file">
                          <span className="mru-icon">⚙</span>
                          <span className="mru-name">component</span>
                        </div>
                        <div className="mru-connect">
                          <div className="mru-line"></div>
                          <svg
                            className="mru-arrow"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 5l7 7m0 0l-7 7m7-7H3"
                            />
                          </svg>
                        </div>
                        <div className="mru-sys">
                          <select
                            className="map-select"
                            value={mappings.component}
                            onChange={(e) =>
                              handleMappingChange("component", e.target.value)
                            }
                          >
                            <option value="Module">Module / Component</option>
                            <option value="Tags">Tags</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mc-preview">
                    <div className="mcp-header">
                      <span className="mcp-title">
                        Data Preview (First 3 Rows)
                      </span>
                    </div>
                    <div className="mcp-table-wrap">
                      <table className="mcp-table">
                        <thead>
                          <tr>
                            <th>{mappings.bug_id}</th>
                            <th>{mappings.summary}</th>
                            <th>{mappings.severity_lvl}</th>
                            <th>{mappings.component}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>PROJ-1022</td>
                            <td>Login button unresponsive on iOS Safari</td>
                            <td>
                              <span className="badge-high">High</span>
                            </td>
                            <td>Authentication</td>
                          </tr>
                          <tr>
                            <td>PROJ-1023</td>
                            <td>Typo in welcome email template</td>
                            <td>
                              <span className="badge-low">Low</span>
                            </td>
                            <td>Onboarding</td>
                          </tr>
                          <tr>
                            <td>PROJ-1024</td>
                            <td>500 Error when uploading large PDF</td>
                            <td>
                              <span className="badge-critical">Critical</span>
                            </td>
                            <td>File Upload</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="wizard-actions">
                  <button
                    className="dash-btn btn-ghost-dark"
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </button>
                  <button
                    className="dash-btn dash-btn-primary btn-lg"
                    onClick={handleImport}
                  >
                    Confirm &amp; Import Data
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
          <div className="step-content animate-fade-in text-center">
            <div className="success-zone">
              <div className="sz-icon-container">
                <div className="sz-icon-pulse"></div>
                <div className="sz-icon">
                  <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                    className="w-10 h-10"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="sz-title">Import completed!</h2>
              <div className="sz-number">482</div>
              <p className="sz-desc">
                defects successfully securely imported, parsed, and indexed by
                AI. They are now ready for querying.
              </p>

              <div className="sz-actions">
                <button
                  className="dash-btn btn-ghost-dark"
                  onClick={() => router.push("/dashboard")}
                >
                  Back to Dashboard
                </button>
                <Link
                  href="/dashboard/explorer"
                  className="dash-btn dash-btn-primary"
                >
                  Open in Explorer →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
