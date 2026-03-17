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
  const [checkoutStep, setCheckoutStep] = useState<"plans" | "payment">(
    "plans",
  );
  const [selectedPlan, setSelectedPlan] = useState<{
    name: string;
    price: string;
  } | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const profilePicRef = useRef<HTMLInputElement>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    planType,
    setPlanType,
    setStatus,
    setTrialEndDate,
    setPaymentMethod,
    paymentMethod,
    usage,
    status,
    trialEndDate,
  } = useBilling();

  // Helper to calculate trial days left
  const getTrialDaysLeft = () => {
    if (!trialEndDate) return 0;
    const end = new Date(trialEndDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

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

  const handleStartCheckout = (name: string, price: string) => {
    setSelectedPlan({ name, price });
    setCheckoutStep("payment");
  };

  const handleCompleteCheckout = () => {
    setIsProcessingCheckout(true);
    // Simulate ABA PayWay Vaulting / Payment
    setTimeout(() => {
      setPlanType("team");
      setStatus("trialing");
      // Trial ends in 14 days
      const d = new Date();
      d.setDate(d.getDate() + 14);
      setTrialEndDate(d.toISOString());
      setPaymentMethod({
        brand: "Visa",
        last4: cardNumber.replace(/\s/g, "").slice(-4) || "4242",
        expiry: expiry || "12/28",
      });

      setIsProcessingCheckout(false);
      setIsManagingPlan(false);
      setCheckoutStep("plans");
      setSelectedPlan(null);
    }, 2000);
  };

  const handleSendInvite = () => {
    if (!inviteEmail) return;
    setIsSending(true);
    // Simulate API call
    setTimeout(() => {
      setIsSending(false);
      setShowSuccess(true);
      setInviteEmail("");
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
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
              onClick={() => {
                if (checkoutStep === "payment") {
                  setCheckoutStep("plans");
                } else {
                  setIsManagingPlan(false);
                }
              }}
              style={{
                marginBottom: "24px",
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--ink)",
              }}
            >
              &larr;{" "}
              {checkoutStep === "payment" ? "Back to Plans" : "Back to Billing"}
            </button>
            <div className="set-section">
              {checkoutStep === "plans" ? (
                <>
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
                          background: "var(--surface3)",
                          color: "var(--ink3)",
                          border: "1px solid var(--border)",
                          cursor: "not-allowed",
                        }}
                        disabled
                      >
                        Individual Plan
                      </button>
                    </div>

                    {/* Team Plan */}
                    <div className="plan-card">
                      <h3 className="plan-card-title">QA Intel Team</h3>
                      <p className="plan-card-desc">
                        Advanced AI analysis and predictive reporting for
                        growing teams.
                      </p>
                      <div className="plan-price-wrap">
                        <span className="plan-price">$79</span>
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
                          Unlimited AI Chat queries
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
                        onClick={() =>
                          handleStartCheckout("QA Intel Team", "79")
                        }
                        style={{
                          width: "100%",
                          justifyContent: "center",
                        }}
                      >
                        Upgrade to Team
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="checkout-view animate-fade-in">
                  <div style={{ display: "flex", gap: "40px" }}>
                    {/* Left: Card Entry */}
                    <div style={{ flex: 1 }}>
                      <h2 className="set-title">Secure Checkout</h2>
                      <p className="set-desc">
                        Powered by <strong>ABA PayWay</strong>. Your card
                        details are securely vaulted.
                      </p>

                      <div style={{ marginTop: "32px" }}>
                        <div className="set-field">
                          <label className="set-label">Name on Card</label>
                          <input
                            type="text"
                            className="set-input"
                            placeholder="John Doe"
                            style={{ maxWidth: "100%" }}
                          />
                        </div>
                        <div className="set-field">
                          <label className="set-label">Card Number</label>
                          <div style={{ position: "relative" }}>
                            <input
                              type="text"
                              className="set-input"
                              placeholder="0000 0000 0000 0000"
                              maxLength={19}
                              value={cardNumber}
                              onChange={handleCardChange}
                              style={{ maxWidth: "100%", paddingRight: "40px" }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                opacity: 0.5,
                              }}
                            >
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect
                                  x="2"
                                  y="5"
                                  width="20"
                                  height="14"
                                  rx="2"
                                />
                                <line x1="2" y1="10" x2="22" y2="10" />
                              </svg>
                            </div>
                          </div>
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
                              style={{ maxWidth: "100%" }}
                            />
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: "40px",
                            padding: "16px",
                            background: "rgba(13, 148, 136, 0.05)",
                            borderRadius: "8px",
                            border: "1px solid rgba(13, 148, 136, 0.1)",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--ink2)",
                              lineHeight: "1.5",
                            }}
                          >
                            By clicking "Complete Upgrade", you agree to start a{" "}
                            <strong>14-day free trial</strong>. After the trial
                            ends, you will be charged{" "}
                            <strong>${selectedPlan?.price}/month</strong> unless
                            canceled.
                          </div>
                        </div>

                        <button
                          className="dash-btn dash-btn-primary"
                          onClick={handleCompleteCheckout}
                          disabled={isProcessingCheckout}
                          style={{
                            width: "100%",
                            height: "48px",
                            marginTop: "24px",
                            justifyContent: "center",
                            fontSize: "15px",
                          }}
                        >
                          {isProcessingCheckout
                            ? "Processing Securely..."
                            : "Complete Upgrade"}
                        </button>

                        <div
                          style={{
                            textAlign: "center",
                            marginTop: "16px",
                            fontSize: "11px",
                            color: "var(--ink3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                          SSL Encrypted & PCI Compliant
                        </div>
                      </div>
                    </div>

                    {/* Right: Order Summary */}
                    <div
                      style={{
                        width: "300px",
                        padding: "24px",
                        background: "var(--surface2)",
                        borderRadius: "12px",
                        border: "1px solid var(--border)",
                        alignSelf: "flex-start",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "var(--ink)",
                          marginBottom: "16px",
                        }}
                      >
                        Order Summary
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "12px",
                          fontSize: "13px",
                        }}
                      >
                        <span style={{ color: "var(--ink2)" }}>
                          {selectedPlan?.name}
                        </span>
                        <span style={{ color: "var(--ink)" }}>
                          ${selectedPlan?.price}.00
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "20px",
                          fontSize: "13px",
                        }}
                      >
                        <span style={{ color: "var(--ink2)" }}>
                          Trial Discount
                        </span>
                        <span style={{ color: "var(--green)" }}>-100%</span>
                      </div>
                      <div
                        style={{
                          borderTop: "1px solid var(--border)",
                          paddingTop: "16px",
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "15px",
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ color: "var(--ink)" }}>Due Today</span>
                        <span style={{ color: "var(--teal2)" }}>$0.00</span>
                      </div>
                      <div
                        style={{
                          marginTop: "24px",
                          fontSize: "12px",
                          color: "var(--ink3)",
                        }}
                      >
                        First charging date:
                        <br />
                        <strong>
                          {new Date(
                            Date.now() + 14 * 24 * 60 * 60 * 1000,
                          ).toLocaleDateString()}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                    Upgrade to the Team plan to invite up to 4 members. Everyone
                    gets their own login with shared access to your datasets and
                    AI history.
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
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <button
                      className="dash-btn dash-btn-primary"
                      style={{ height: "40px", minWidth: "120px" }}
                      onClick={handleSendInvite}
                      disabled={isSending || !inviteEmail}
                    >
                      {isSending ? "Sending..." : "Send Invite"}
                    </button>
                  </div>

                  {showSuccess && (
                    <div
                      style={{
                        background: "rgba(13, 148, 136, 0.1)",
                        color: "var(--teal2)",
                        padding: "12px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        marginBottom: "24px",
                        textAlign: "center",
                        border: "1px solid rgba(13, 148, 136, 0.2)",
                        animation: "fade-in 0.3s ease",
                      }}
                    >
                      Invitation sent successfully!
                    </div>
                  )}

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
                    Active Members (1 / 4)
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
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <h3>
                    {planType === "starter" ? "Starter Plan" : "QA Intel Team"}
                  </h3>
                  {status === "trialing" && (
                    <span
                      style={{
                        background: "rgba(13, 148, 136, 0.1)",
                        color: "var(--teal2)",
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      Trialing: {getTrialDaysLeft()} days left
                    </span>
                  )}
                  {status === "active" && (
                    <span
                      style={{
                        background: "rgba(34, 197, 94, 0.1)",
                        color: "#16a34a",
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>
                <p>
                  {planType === "starter"
                    ? "Basic core analytics"
                    : "Advanced AI Analysis & Predictive Reports"}
                </p>
              </div>
              <div className="sub-price">
                ${planType === "starter" ? "0" : "79"}
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

            {paymentMethod && (
              <div
                style={{
                  marginTop: "24px",
                  padding: "16px",
                  background: "var(--surface2)",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "24px",
                      background: "#f8f9fa",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#000",
                    }}
                  >
                    {paymentMethod.brand.toUpperCase()}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--ink)",
                        fontWeight: 500,
                      }}
                    >
                      **** **** **** {paymentMethod.last4}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--ink3)" }}>
                      Expires {paymentMethod.expiry}
                    </div>
                  </div>
                </div>
                <button
                  className="dt-action"
                  onClick={() => setIsUpdatingPayment(true)}
                >
                  Edit
                </button>
              </div>
            )}

            <div className="usage-wrap" style={{ marginTop: "32px" }}>
              <div className="usage-header">
                <span>Dataset Storage Usage</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {planType === "starter" ? "0.2 GB / 1 GB" : "8.4 GB / 10 GB"}
                </span>
              </div>
              <div className="usage-bar-bg">
                <div
                  className="usage-bar-fill"
                  style={{ width: planType === "starter" ? "20%" : "84%" }}
                ></div>
              </div>
              {planType === "starter" && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--ink2)",
                    marginTop: "8px",
                  }}
                >
                  Starter plan limit: 1 dataset.
                </p>
              )}
            </div>

            <div className="usage-wrap" style={{ marginTop: "32px" }}>
              <div className="usage-header">
                <span>AI Chat Queries</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {usage.aiQueriesUsed} /{" "}
                  {planType === "starter" ? "20" : "Unlimited"}
                </span>
              </div>
              <div className="usage-bar-bg">
                <div
                  className="usage-bar-fill"
                  style={{
                    width:
                      planType === "starter"
                        ? `${(usage.aiQueriesUsed / 20) * 100}%`
                        : "15%",
                    background: "var(--teal)",
                  }}
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
              {planType === "starter" ? (
                <button
                  className="dash-btn dash-btn-primary"
                  onClick={() => {
                    setIsManagingPlan(true);
                    setCheckoutStep("plans");
                  }}
                >
                  Upgrade to Team
                </button>
              ) : (
                <button
                  className="dash-btn"
                  onClick={() => {
                    setIsManagingPlan(true);
                    setCheckoutStep("plans");
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--ink)",
                  }}
                >
                  Change Plan
                </button>
              )}
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
