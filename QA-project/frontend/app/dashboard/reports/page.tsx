"use client";

import React from 'react';

export default function ReportsPage() {
  return (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Reports</h1>
      </div>
      <div className="dash-content">
        <div style={{ padding: '60px 40px', border: '1px solid var(--border)', background: 'var(--surface2)', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
          <h3 style={{ fontSize: '20px', fontFamily: '"Instrument Serif", serif', color: 'var(--ink)', marginBottom: '8px' }}>Custom Reports</h3>
          <p style={{ color: 'var(--ink2)', fontSize: '14px', marginBottom: '24px' }}>Generate and schedule automated risk reports.</p>
          <button className="dash-btn dash-btn-primary">Create Report</button>
        </div>
      </div>
    </>
  );
}
