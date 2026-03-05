import React from 'react';

export function HowItWorksSection() {
  return (
    <section className="how-section" id="how">
      <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <span className="section-eyebrow">How It Works</span>
        <h2 className="section-title">From raw bug data to<br /><em>actionable intelligence</em></h2>
        <p className="section-sub" style={{ margin: '0 auto' }}>Four steps. Under five minutes to set up. Instant insights from your very first upload.</p>
        <div className="steps-row">
          <div className="step-item">
            <div className="step-num">1</div>
            <div className="step-title">Export your bug data</div>
            <div className="step-desc">Download a CSV or XLSX export from Jira, GitHub Issues, Linear, or any tracker.</div>
          </div>
          <div className="step-item">
            <div className="step-num">2</div>
            <div className="step-title">Upload &amp; map columns</div>
            <div className="step-desc">Drag and drop your file. Our smart column mapper auto-detects your fields in seconds.</div>
          </div>
          <div className="step-item">
            <div className="step-num">3</div>
            <div className="step-title">AI indexes your data</div>
            <div className="step-desc">Our RAG pipeline embeds your defect history into a vector database, ready for intelligent retrieval.</div>
          </div>
          <div className="step-item">
            <div className="step-num">4</div>
            <div className="step-title">Query &amp; act on insights</div>
            <div className="step-desc">Ask questions, view dashboards, predict risks, and export reports &mdash; all grounded in your real data.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
