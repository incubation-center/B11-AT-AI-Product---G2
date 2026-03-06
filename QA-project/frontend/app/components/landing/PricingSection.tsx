import React from "react";
import Link from "next/link";

export function PricingSection() {
  return (
    <section className="pricing-section" id="pricing">
      <div
        style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}
      >
        <span className="section-eyebrow">Pricing</span>
        <h2 className="section-title">
          Simple, transparent pricing
          <br />
          <em>for every team size</em>
        </h2>
        <p className="section-sub" style={{ margin: "0 auto" }}>
          Start free. No credit card required. Upgrade when your team is ready.
        </p>
      </div>
      <div className="pricing-grid">
        {/* STARTER */}
        <div className="price-card">
          <div className="price-plan">Starter</div>
          <div className="price-val">
            <span>$</span>0
          </div>
          <div className="price-per">forever free</div>
          <div className="price-desc">
            Perfect for solo QA engineers or small teams exploring AI-powered
            defect analysis for the first time.
          </div>
          <ul className="price-features">
            <li>Up to 500 defects</li>
            <li>1 dataset upload</li>
            <li>Defect Explorer</li>
            <li>AI Chat (20 queries/month)</li>
            <li>Dashboard overview</li>
            <li className="na">Regression risk predictor</li>
            <li className="na">Test coverage gap detection</li>
            <li className="na">API access</li>
          </ul>
          <Link href="/signup" className="price-btn outline">
            Get started free
          </Link>
        </div>

        {/* TEAM */}
        <div className="price-card featured">
          <div className="featured-badge">Most popular</div>
          <div className="price-plan">Team</div>
          <div className="price-val">
            <span>$</span>79
          </div>
          <div className="price-per">per month &middot; billed monthly</div>
          <div className="price-desc">
            For QA teams who need the full power of defect intelligence across
            multiple projects and releases.
          </div>
          <ul className="price-features">
            <li>Unlimited defects</li>
            <li>Unlimited dataset uploads</li>
            <li>Defect Explorer + export</li>
            <li>AI Chat (unlimited)</li>
            <li>Dashboard + custom reports</li>
            <li>Regression risk predictor</li>
            <li>Test coverage gap detection</li>
            <li>Up to 10 team members</li>
          </ul>
          <Link href="/signup" className="price-btn filled">
            Start 14-day free trial &rarr;
          </Link>
        </div>

        {/* ENTERPRISE */}
        <div className="price-card" style={{ opacity: 0.7 }}>
          <div className="price-plan">Enterprise</div>
          <div
            className="price-val"
            style={{ fontSize: "34px", marginTop: "11px" }}
          >
            Future Plan
          </div>
          <div className="price-per">planned for a later phase</div>
          <div className="price-desc">
            For larger organizations that need custom integrations, on-premise
            deployment, or SLA guarantees.
          </div>
          <ul className="price-features">
            <li>Everything in Team</li>
            <li>Unlimited team members</li>
            <li>SSO / SAML login</li>
            <li>On-premise deployment option</li>
            <li>API licensing</li>
            <li>Custom Jira / Slack integration</li>
            <li>Dedicated support + SLA</li>
            <li>Custom data retention policy</li>
          </ul>
          <button
            disabled
            className="price-btn outline"
            style={{ opacity: 0.5, cursor: "not-allowed" }}
          >
            Future plan
          </button>
        </div>
      </div>
    </section>
  );
}
