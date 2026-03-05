"use client";

import React from 'react';

export default function ChatPage() {
  return (
    <>
      <div className="dash-header">
        <h1 className="dash-title">AI Assistant</h1>
        <div className="dash-header-actions">
          <span className="dash-date">Dataset: Last 6 Months</span>
        </div>
      </div>
      <div className="dash-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)', paddingBottom: '32px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', paddingBottom: '24px' }}>
          
          <div style={{ alignSelf: 'flex-end', background: 'var(--surface2)', padding: '16px 20px', borderRadius: '12px', borderBottomRightRadius: '4px', maxWidth: '70%', fontSize: '14px', border: '1px solid var(--border)' }}>
            What are the top 3 riskiest modules before our March release?
          </div>

          <div style={{ alignSelf: 'flex-start', background: 'rgba(13,148,136,.12)', border: '1px solid rgba(13,148,136,.2)', padding: '16px 20px', borderRadius: '12px', borderBottomLeftRadius: '4px', maxWidth: '75%', fontSize: '14px', color: 'var(--teal3)' }}>
            <p style={{ marginBottom: '16px' }}>Based on your last 6 months of defect data, here are the highest-risk modules:</p>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', color: 'var(--ink)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px' }}>🔴 Regression Risk &mdash; March Release</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--ink3)', width: '80px', fontFamily: '"JetBrains Mono", monospace' }}>Auth</span>
                <div style={{ flex: 1, height: '6px', background: 'var(--surface3)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--teal)', width: '92%', borderRadius: '3px' }}></div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--ink3)', width: '30px', textAlign: 'right', fontFamily: '"JetBrains Mono", monospace' }}>92%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--ink3)', width: '80px', fontFamily: '"JetBrains Mono", monospace' }}>Billing</span>
                <div style={{ flex: 1, height: '6px', background: 'var(--surface3)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--teal)', width: '78%', borderRadius: '3px' }}></div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--ink3)', width: '30px', textAlign: 'right', fontFamily: '"JetBrains Mono", monospace' }}>78%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--ink3)', width: '80px', fontFamily: '"JetBrains Mono", monospace' }}>API Gateway</span>
                <div style={{ flex: 1, height: '6px', background: 'var(--surface3)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--teal)', width: '65%', borderRadius: '3px' }}></div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--ink3)', width: '30px', textAlign: 'right', fontFamily: '"JetBrains Mono", monospace' }}>65%</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink3)', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '10px' }}>
                📎 Source: Dataset #3 &middot; 1,284 defects &middot; Jan–Mar 2025
              </div>
            </div>
          </div>
          
        </div>

        <div style={{ marginTop: 'auto', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Ask about your defects, risks, or patterns..." 
            style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', color: 'var(--ink)', fontSize: '14px', outline: 'none' }}
          />
          <button style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'var(--teal)', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
            ↑
          </button>
        </div>
      </div>
    </>
  );
}
