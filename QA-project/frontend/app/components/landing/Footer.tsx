import React from "react";

export function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">
            <div className="nav-logo-mark">Q</div>
            <span style={{ fontSize: "15px", fontWeight: 500 }}>
              QA Intelligence
            </span>
          </div>
          <div className="footer-desc">
            AI-powered defect pattern analysis, test gap detection, and
            regression risk prediction for software QA teams.
          </div>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Product</div>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#how">How it works</a>
          <a href="/changelog">Changelog</a>
          <a href="/roadmap">Roadmap</a>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-copy">
          &copy; 2025 QA Intelligence. All rights reserved.
        </div>
        <div className="footer-links">
          <a href="#">Twitter</a>
          <a href="#">LinkedIn</a>
          <a href="#">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
