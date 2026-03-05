"use client";

import React from 'react';

export default function ExplorerPage() {
  return (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Defect Explorer</h1>
        <div className="dash-header-actions">
          <button className="dash-btn" style={{ background: 'var(--surface2)', color: 'var(--ink2)', border: '1px solid var(--border)' }}>
            Filter ▾
          </button>
          <button className="dash-btn dash-btn-primary">
            Export CSV
          </button>
        </div>
      </div>
      <div className="dash-content">
        <div className="chart-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px' }}>
            <input 
              type="text" 
              placeholder="Search defects, modules, or patterns..." 
              style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 16px', color: 'var(--ink)', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink3)' }}>
            <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px' }}>DATA TABLE PENDING IMPLEMENTATION</p>
          </div>
        </div>
      </div>
    </>
  );
}
