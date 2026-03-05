import React from 'react';
import Link from 'next/link';

export function CTABanner() {
  return (
    <section className="cta-section">
      <h2 className="cta-title">Your next release deserves<br />better than <em>a guess.</em></h2>
      <p className="cta-sub">Start your free 14-day trial. No credit card required. Up and running in under 5 minutes.</p>
      <div className="cta-actions">
        <Link href="/signup" className="btn-hero">Start free trial &rarr;</Link>
        <a href="#demo" className="btn-hero-outline">See a live demo</a>
      </div>
      <div style={{ marginTop: '24px', fontSize: '13px', color: 'var(--ink3)' }}>
        Trusted by QA engineers at 200+ software teams
      </div>
    </section>
  );
}
