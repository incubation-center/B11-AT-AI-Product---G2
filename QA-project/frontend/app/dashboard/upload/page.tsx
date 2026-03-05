"use client";

import React from 'react';

export default function UploadPage() {
  return (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Upload Data</h1>
      </div>
      <div className="dash-content">
        <div style={{ padding: '60px 40px', border: '2px dashed var(--border)', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
          <h3 style={{ fontSize: '20px', fontFamily: '"Instrument Serif", serif', color: 'var(--ink)', marginBottom: '8px' }}>Drag and drop your bug data</h3>
          <p style={{ color: 'var(--ink2)', fontSize: '14px', marginBottom: '24px' }}>Supports CSV, JSON, and direct Jira/GitHub exports.</p>
          <button className="dash-btn dash-btn-primary">Browse Files</button>
        </div>
      </div>
    </>
  );
}
