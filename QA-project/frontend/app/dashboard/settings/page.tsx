"use client";

import React, { useState, useRef } from "react";
import { useBilling } from "../../contexts/BillingContext";

type SettingsTab = "profile" | "data" | "billing" | "team";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("billing");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isManagingPlan, setIsManagingPlan] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [isCancelingPlan, setIsCancelingPlan] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const profilePicRef = useRef<HTMLInputElement>(null);

  const { planType } = useBilling();

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    val = val.substring(0, 16);
    const parts = [];
    for (let i = 0; i < val.length; i += 4) {
      parts.push(val.substring(i, i + 4));
    }
    setCardNumber(parts.join(" "));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    val = val.substring(0, 4);
    if (val.length >= 3) {
      setExpiry(val.substring(0, 2) + "/" + val.substring(2));
    } else {
      setExpiry(val);
    }
  };

  const renderContent = () => {
    if (activeTab === "profile") {
      return (
        <div className="animate-fade-in">
          <div className="set-section">
            <h2 className="set-title">Profile Information</h2>
            <p className="set-desc">
              Update your personal details, avatar, and contact information.
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "var(--surface3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid var(--border)",
                  fontSize: "24px",
                  color: "var(--ink)",
                }}
              >
                U
              </div>
              <div>
                {!isEditingProfile ? (
                  <div style={{ fontSize: "14px", color: "var(--ink2)" }}>
                    Click "Edit Profile" below to change your picture.
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      ref={profilePicRef}
                      accept=".png, .jpg, .jpeg"
                      style={{ display: "none" }}
                    />
                    <button
                      className="dash-btn"
                      onClick={() => profilePicRef.current?.click()}
                      style={{
                        background: "var(--surface3)",
                        color: "var(--ink)",
                        padding: "8px 16px",
                        fontSize: "13px",
                        border: "1px solid var(--border)",
                      }}
                    >
                      Upload New Picture
                    </button>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--ink3)",
                        marginTop: "8px",
                      }}
                    >
                      PNG, JPG only. 1MB max.
                    </div>
                  </>
                )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              <div className="set-field">
                <label className="set-label">Full Name</label>
                <input
                  type="text"
                  className="set-input"
                  style={{
                    maxWidth: "100%",
                    opacity: isEditingProfile ? 1 : 0.6,
                  }}
                  disabled={!isEditingProfile}
                  defaultValue="QA Manager"
                />
              </div>
              <div className="set-field">
                <label className="set-label">Email Address</label>
                <input
                  type="email"
                  className="set-input"
                  style={{
                    maxWidth: "100%",
                    opacity: isEditingProfile ? 1 : 0.6,
                  }}
                  disabled={!isEditingProfile}
                  defaultValue="manager@company.com"
                />
              </div>
              <div className="set-field">
                <label className="set-label">Job Title / Role</label>
                <input
                  type="text"
                  className="set-input"
                  style={{
                    maxWidth: "100%",
                    opacity: isEditingProfile ? 1 : 0.6,
                  }}
                  disabled={!isEditingProfile}
                  defaultValue="Head of Quality Assurance"
                />
              </div>
              <div className="set-field">
                <label className="set-label">Company Name</label>
                <input
                  type="text"
                  className="set-input"
                  style={{
                    maxWidth: "100%",
                    opacity: isEditingProfile ? 1 : 0.6,
                  }}
                  disabled={!isEditingProfile}
                  defaultValue="Acme Corp"
                />
              </div>
            </div>

            <div className="set-field" style={{ marginTop: "12px" }}>
              <label className="set-label">Timezone</label>
              <select
                className="set-input"
                defaultValue="pst"
                disabled={!isEditingProfile}
                style={{
                  opacity: isEditingProfile ? 1 : 0.6,
                  cursor: isEditingProfile ? "pointer" : "default",
                }}
              >
                <option value="est">Eastern Time (ET)</option>
                <option value="cst">Central Time (CT)</option>
                <option value="pst">Pacific Time (PT) - Current</option>
                <option value="gmt">Greenwich Mean Time (GMT)</option>
              </select>
            </div>

            <h3
              className="set-title"
              style={{ marginTop: "40px", fontSize: "15px" }}
            >
              Email Notifications
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "16px",
                opacity: isEditingProfile ? 1 : 0.6,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "14px",
                  color: "var(--ink)",
                  cursor: isEditingProfile ? "pointer" : "default",
                }}
              >
                <input
                  type="checkbox"
                  defaultChecked
                  disabled={!isEditingProfile}
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "var(--teal)",
                  }}
                />
                Weekly risk summary reports
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "14px",
                  color: "var(--ink)",
                  cursor: isEditingProfile ? "pointer" : "default",
                }}
              >
                <input
                  type="checkbox"
                  defaultChecked
                  disabled={!isEditingProfile}
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "var(--teal)",
                  }}
                />
                Critical defect alerts
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "14px",
                  color: "var(--ink)",
                  cursor: isEditingProfile ? "pointer" : "default",
                }}
              >
                <input
                  type="checkbox"
                  disabled={!isEditingProfile}
                  style={{
                    width: "16px",
                    height: "16px",
                    accentColor: "var(--teal)",
                  }}
                />
                Product updates and beta features
              </label>
            </div>

            <div
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: "24px",
                marginTop: "32px",
                display: "flex",
                gap: "16px",
              }}
            >
              {isEditingProfile ? (
                <>
                  <button
                    className="dash-btn dash-btn-primary"
                    onClick={() => setIsEditingProfile(false)}
                  >
                    Save Changes
                  </button>
                  <button
                    className="dash-btn"
                    onClick={() => setIsEditingProfile(false)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--ink2)",
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="dash-btn dash-btn-primary"
                  onClick={() => setIsEditingProfile(true)}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "data") {
      return (
        <div className="animate-fade-in">
          <div className="set-section">
            <h2 className="set-title">Data Management</h2>
            <p className="set-desc">
              Manage your uploaded datasets, connections, and retention
              policies.
            </p>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Dataset Name</th>
                  <th>Source</th>
                  <th>Date Uploaded</th>
                  <th>Size</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Q1_Regression_Defects.csv</td>
                  <td>Manual Upload</td>
                  <td>Mar 05, 2026</td>
                  <td className="dt-size">24.5 MB</td>
                  <td>
                    <button className="dt-action">Delete</button>
                  </td>
                </tr>
                <tr>
                  <td>Auth_Module_Logs.xlsx</td>
                  <td>Manual Upload</td>
                  <td>Feb 28, 2026</td>
                  <td className="dt-size">8.2 MB</td>
                  <td>
                    <button className="dt-action">Delete</button>
                  </td>
                </tr>
                <tr>
                  <td>JIRA_Auto_Sync_Feb</td>
                  <td>Jira API Integration</td>
                  <td>Feb 20, 2026</td>
                  <td className="dt-size">142.1 MB</td>
                  <td>
                    <button className="dt-action">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>

            <h3
              className="set-title"
              style={{ marginTop: "48px", fontSize: "15px" }}
            >
              Data Retention Policy
            </h3>
            <p className="set-desc" style={{ marginBottom: "16px" }}>
              Configure how long QA Intel retains your raw defect data.
            </p>
            <div className="set-field">
              <select className="set-input" defaultValue="90">
                <option value="30">30 Days</option>
                <option value="90">90 Days (Recommended)</option>
                <option value="365">1 Year</option>
                <option value="unlimited">Unlimited (Enterprise Only)</option>
              </select>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "billing" || activeTab === "team") {
      if (isManagingPlan) {
        return (
          <div className="animate-fade-in">
            <button
              className="dash-btn"
              onClick={() => setIsManagingPlan(false)}
              style={{
                marginBottom: "24px",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--ink)",
              }}
            >
              &larr; Back to Billing
            </button>
            <div className="set-section">
              <h2 className="set-title">Upgrade Your Plan</h2>
              <p className="set-desc">
                Choose the perfect tier for your QA workflow needs.
              </p>

              <div className="plan-grid">
                {/* Free Plan */}
                <div className="plan-card">
                  <h3 className="plan-card-title">Basic Core</h3>
                  <p className="plan-card-desc">
                    For small teams getting started with basic analytics.
                  </p>
                  <div className="plan-price-wrap">
                    <span className="plan-price">$0</span>
                    <span className="plan-price-period">/mo</span>
                  </div>
                  <ul className="plan-feat-list">
                    <li className="plan-feat-item">
                      <svg
                        className="plan-feat-icon"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Up to 2 datasets (1GB max each)
                    </li>
                    <li className="plan-feat-item">
                      <svg
                        className="plan-feat-icon"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Standard AI Chat (50 queries/mo)
                    </li>
                    <li className="plan-feat-item">
                      <svg
                        className="plan-feat-icon"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      30-day data retention
                    </li>
                  </ul>
                  <button
                    className="dash-btn"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      background: "transparent",
                      color: "var(--ink)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Downgrade to Basic
                  </button>
                </div>

                {/* Pro Plan */}
                <div className="plan-card active">
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "var(--teal)",
                      color: "white",
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "4px 12px",
                      borderRadius: "12px",
                    }}
                  >
                    CURRENT PLAN
                  </div>
                  <h3 className="plan-card-title">QA Intel Pro</h3>
                  <p className="plan-card-desc">
                    Advanced AI analysis and predictive reporting for growing
                    teams.
                  </p>
                  <div className="plan-price-wrap">
                    <span className="plan-price">$49</span>
                    <span className="plan-price-period">/mo</span>
                  </div>
                  <ul className="plan-feat-list">
                    <li className="plan-feat-item">
                      <svg
                        className="plan-feat-icon"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      10GB Storage & Unlimited Datasets
                    </li>
                    <li className="plan-feat-item">
                      <svg
                        className="plan-feat-icon"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      500 Advanced AI Chat queries
                    </li>
                    <li className="plan-feat-item">
                      <svg
                        className="plan-feat-icon"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Custom Report Generation
                    </li>
                    <li className="plan-feat-item">
                      <svg
                        className="plan-feat-icon"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      90-day data retention
                    </li>
                  </ul>
                  <button
                    className="dash-btn dash-btn-primary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      pointerEvents: "none",
                      opacity: 0.5,
                    }}
                  >
                    Current Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      if (activeTab === "team") {
        return (
          <div className="animate-fade-in">
            <div className="set-section">
              <h2 className="set-title">Team Workspace</h2>
              <p className="set-desc">
                Manage the members of your QA workspace and their access levels.
              </p>

              {planType === "starter" ? (
                <div
                  style={{
                    background: "rgba(13, 148, 136, 0.05)",
                    border: "1px solid var(--teal)",
                    padding: "32px",
                    borderRadius: "12px",
                    textAlign: "center",
                  }}
                >
                  <svg
                    width="48"
                    height="48"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="var(--teal)"
                    style={{ margin: "0 auto 16px" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <h3
                    style={{
                      fontSize: "18px",
                      color: "var(--ink)",
                      marginBottom: "8px",
                      fontWeight: 600,
                    }}
                  >
                    Collaborate with your whole team
                  </h3>
                  <p
                    style={{
                      color: "var(--ink2)",
                      fontSize: "14px",
                      marginBottom: "24px",
                      maxWidth: "400px",
                      margin: "0 auto 24px",
                    }}
                  >
                    Upgrade to the Team plan to invite up to 10 members.
                    Everyone gets their own login with shared access to your
                    datasets and AI history.
                  </p>
                  <button
                    className="dash-btn dash-btn-primary"
                    onClick={() => setActiveTab("billing")}
                  >
                    View Team Plan
                  </button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      marginBottom: "32px",
                      alignItems: "flex-end",
                    }}
                  >
                    <div
                      className="set-field"
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <label className="set-label">Invite user via Email</label>
                      <input
                        type="email"
                        className="set-input"
                        placeholder="colleague@company.com"
                        style={{ maxWidth: "100%" }}
                      />
                    </div>
                    <button
                      className="dash-btn dash-btn-primary"
                      style={{ height: "40px" }}
                    >
                      Send Invite
                    </button>
                  </div>

                  <h3
                    className="set-title"
                    style={{
                      fontSize: "15px",
                      color: "var(--ink)",
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    Active Members (1 / 10)
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "var(--teal)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        U
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "var(--ink)",
                          }}
                        >
                          You (Owner)
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--ink3)" }}>
                          manager@company.com
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--teal2)",
                        background: "rgba(13,148,136,0.1)",
                        padding: "4px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      Owner
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      }

      if (isUpdatingPayment) {
        return (
          <div className="animate-fade-in">
            <button
              className="dash-btn"
              onClick={() => setIsUpdatingPayment(false)}
              style={{
                marginBottom: "24px",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--ink)",
              }}
            >
              &larr; Back to Billing
            </button>
            <div className="set-section">
              <h2 className="set-title">Update Payment Method</h2>
              <p className="set-desc">
                Update your credit card details for your monthly subscription
                invoice.
              </p>

              <div style={{ maxWidth: "400px", marginTop: "24px" }}>
                <div className="set-field">
                  <label className="set-label">Name on Card</label>
                  <input
                    type="text"
                    className="set-input"
                    defaultValue="QA Manager"
                    style={{ maxWidth: "100%" }}
                  />
                </div>
                <div className="set-field">
                  <label className="set-label">Card Number</label>
                  <input
                    type="text"
                    className="set-input"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    value={cardNumber}
                    onChange={handleCardChange}
                    style={{ maxWidth: "100%" }}
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div className="set-field">
                    <label className="set-label">Expiry</label>
                    <input
                      type="text"
                      className="set-input"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={expiry}
                      onChange={handleExpiryChange}
                      style={{ maxWidth: "100%" }}
                    />
                  </div>
                  <div className="set-field">
                    <label className="set-label">CVC</label>
                    <input
                      type="password"
                      className="set-input"
                      placeholder="***"
                      maxLength={3}
                      inputMode="numeric"
                      onKeyDown={(e) => {
                        const allowedKeys = [
                          "Backspace",
                          "Tab",
                          "ArrowLeft",
                          "ArrowRight",
                          "Delete",
                        ];
                        if (
                          !/[0-9]/.test(e.key) &&
                          !allowedKeys.includes(e.key)
                        ) {
                          e.preventDefault();
                        }
                      }}
                      style={{ maxWidth: "100%" }}
                    />
                  </div>
                </div>
                <div
                  style={{ display: "flex", gap: "16px", marginTop: "32px" }}
                >
                  <button
                    className="dash-btn dash-btn-primary"
                    onClick={() => setIsUpdatingPayment(false)}
                  >
                    Save Card
                  </button>
                  <button
                    className="dash-btn"
                    onClick={() => setIsUpdatingPayment(false)}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border)",
                      color: "var(--ink)",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="animate-fade-in">
          <div className="set-section">
            <h2 className="set-title">Subscription & Billing</h2>
            <p className="set-desc">
              Manage your plan, limits, and billing details.
            </p>

            <div className="sub-plan-card">
              <div className="sub-plan-info">
                <h3>QA Intel Pro</h3>
                <p>Advanced AI Analysis & Predictive Reports</p>
              </div>
              <div className="sub-price">
                $49
                <span
                  style={{
                    fontSize: "15px",
                    color: "var(--ink2)",
                    fontStyle: "normal",
                    fontFamily: "Inter",
                  }}
                >
                  /mo
                </span>
              </div>
            </div>

            <div className="usage-wrap">
              <div className="usage-header">
                <span>Dataset Storage Usage</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  8.4 GB / 10 GB
                </span>
              </div>
              <div className="usage-bar-bg">
                <div className="usage-bar-fill" style={{ width: "84%" }}></div>
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--amber)",
                  marginTop: "8px",
                }}
              >
                You are approaching your storage limit. Upgrade your plan to
                increase limit.
              </p>
            </div>

            <div className="usage-wrap" style={{ marginTop: "32px" }}>
              <div className="usage-header">
                <span>AI Chat Queries</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  142 / 500
                </span>
              </div>
              <div className="usage-bar-bg">
                <div
                  className="usage-bar-fill"
                  style={{ width: "28%", background: "var(--teal)" }}
                ></div>
              </div>
            </div>

            <div
              style={{
                marginTop: "40px",
                display: "flex",
                gap: "16px",
                borderBottom: "1px solid var(--border)",
                paddingBottom: "32px",
              }}
            >
              <button
                className="dash-btn dash-btn-primary"
                onClick={() => setIsManagingPlan(true)}
              >
                Upgrade Plan
              </button>
              <button
                className="dash-btn"
                onClick={() => setIsUpdatingPayment(true)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--ink)",
                }}
              >
                Update Payment Method
              </button>
            </div>

            <div style={{ marginTop: "32px" }}>
              <h3
                className="set-title"
                style={{ fontSize: "15px", color: "var(--ink)" }}
              >
                Cancel Subscription
              </h3>
              <p className="set-desc" style={{ marginBottom: "16px" }}>
                Cancel your current plan and switch to the free Basic Core
                dataset tier. You will lose access to Pro features at the end of
                your billing cycle.
              </p>

              {!isCancelingPlan ? (
                <button
                  className="dash-btn"
                  onClick={() => setIsCancelingPlan(true)}
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "var(--coral)",
                    border: "1px solid var(--coral)",
                  }}
                >
                  Cancel Plan
                </button>
              ) : (
                <div
                  className="animate-fade-in"
                  style={{
                    padding: "20px",
                    background: "rgba(239, 68, 68, 0.05)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--coral)",
                      marginBottom: "8px",
                    }}
                  >
                    Are you sure you want to cancel?
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--ink2)",
                      marginBottom: "20px",
                    }}
                  >
                    Your data retention will be securely reduced to 30 days and
                    you will lose access to Advanced AI Chat limits. This action
                    cannot be undone immediately.
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      className="dash-btn"
                      onClick={() => setIsCancelingPlan(false)}
                      style={{
                        background: "var(--coral)",
                        color: "white",
                        border: "none",
                      }}
                    >
                      Confirm Cancelation
                    </button>
                    <button
                      className="dash-btn"
                      onClick={() => setIsCancelingPlan(false)}
                      style={{
                        background: "var(--surface2)",
                        border: "1px solid var(--border)",
                        color: "var(--ink)",
                      }}
                    >
                      Nevermind, keep my plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Settings</h1>
      </div>

      <div className="dash-content" style={{ padding: 0 }}>
        <div className="settings-container">
          {/* Settings Left Nav */}
          <div className="settings-nav">
            <div
              className={`set-nav-item ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Profile
            </div>
            <div
              className={`set-nav-item ${activeTab === "data" ? "active" : ""}`}
              onClick={() => setActiveTab("data")}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
              Data Management
            </div>
            <div
              className={`set-nav-item ${activeTab === "team" ? "active" : ""}`}
              onClick={() => setActiveTab("team")}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Team
            </div>
            <div
              className={`set-nav-item ${activeTab === "billing" ? "active" : ""}`}
              onClick={() => setActiveTab("billing")}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              Subscription
            </div>
          </div>

          {/* Settings Content Area */}
          <div className="settings-content">{renderContent()}</div>
        </div>
      </div>
    </>
  );
}
