import React from 'react';

export function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">
            <div className="nav-logo-mark">Q</div>
            <span style={{ fontSize: '15px', fontWeight: 500 }}>QA Intelligence</span>
          </div>
          <div className="footer-desc">AI-powered defect pattern analysis, test gap detection, and regression risk prediction for software QA teams.</div>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Product</div>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#how">How it works</a>
          <a href="/changelog">Changelog</a>
          <a href="/roadmap">Roadmap</a>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Company</div>
          <a href="/about">About</a>
          <a href="/blog">Blog</a>
          <a href="/careers">Careers</a>
          <a href="mailto:hello@qaintelligence.io">Contact</a>
        </div>
        <div className="footer-col">
          <div className="footer-col-title">Legal</div>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/security">Security</a>
          <a href="/dpa">DPA</a>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="footer-copy">&copy; 2025 QA Intelligence. All rights reserved.</div>
        <div className="footer-links">
          <a href="#">Twitter</a>
          <a href="#">LinkedIn</a>
          <a href="#">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
