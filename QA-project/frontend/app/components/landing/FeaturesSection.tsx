import React from 'react';

export function FeaturesSection() {
  return (
    <section className="features-section" id="features">
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <span className="section-eyebrow">Core Features</span>
        <h2 className="section-title">Everything your QA team<br /><em>actually needs</em></h2>
        <p className="section-sub" style={{ margin: '0 auto' }}>
          Four AI-powered capabilities built on a RAG pipeline &mdash; grounded entirely in your own historical defect data, not generic AI guesses.
        </p>
      </div>
      <div className="features-grid">
        <div className="feat-card">
          <div className="feat-icon teal">🔍</div>
          <div className="feat-title">Defect Pattern Analyzer</div>
          <div className="feat-desc">Automatically groups recurring defects by module, root cause, and severity. Surfaces the top failure patterns across your entire defect history so you know exactly where to focus.</div>
          <div className="feat-tag">RAG-powered</div>
        </div>
        <div className="feat-card">
          <div className="feat-icon coral">🕳️</div>
          <div className="feat-title">Test Coverage Gap Detection</div>
          <div className="feat-desc">Compares your historical bug data against your existing test cases. Identifies modules with high defect rates but low test coverage, and suggests new test scenarios based on past failures.</div>
          <div className="feat-tag">Actionable insights</div>
        </div>
        <div className="feat-card">
          <div className="feat-icon amber">⚡</div>
          <div className="feat-title">Regression Risk Predictor</div>
          <div className="feat-desc">Analyzes release notes alongside historical defect patterns to predict which modules are most likely to regress. Know your risk profile before you ship &mdash; not after.</div>
          <div className="feat-tag">Pre-release planning</div>
        </div>
        <div className="feat-card">
          <div className="feat-icon blue">🤖</div>
          <div className="feat-title">Intelligent QA Assistant</div>
          <div className="feat-desc">Ask anything in plain English: &quot;What bugs appear after payment refactoring?&quot; Get answers grounded in retrieved historical defects &mdash; with source citations, not hallucinations.</div>
          <div className="feat-tag">No hallucinations</div>
        </div>
        <div className="feat-card">
          <div className="feat-icon violet">📊</div>
          <div className="feat-title">Defect Explorer</div>
          <div className="feat-desc">A powerful searchable, filterable data table for your entire defect history. Sort by severity, module, status, or date. Export filtered views directly as CSV.</div>
          <div className="feat-tag">Full-text search</div>
        </div>
        <div className="feat-card">
          <div className="feat-icon green">📁</div>
          <div className="feat-title">Smart Data Import</div>
          <div className="feat-desc">Drag and drop exports from Jira, GitHub Issues, or any CSV. Our column mapping UI auto-detects your fields and maps them to the system. Up and running in minutes.</div>
          <div className="feat-tag">Jira &middot; GitHub &middot; CSV</div>
        </div>
      </div>
    </section>
  );
}
