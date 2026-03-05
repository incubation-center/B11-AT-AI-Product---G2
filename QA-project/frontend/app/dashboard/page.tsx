"use client";

import React from 'react';

export default function DashboardOverviewPage() {
  return (
    <>
      <div className="dash-header">
        <h1 className="dash-title">Dashboard</h1>
        <div className="dash-header-actions">
          <span className="dash-date">Last 30 days ▾</span>
          <button className="dash-btn dash-btn-primary">
            + Upload Data
          </button>
        </div>
      </div>

      <div className="dash-content">
        <div className="metric-grid">
          <div className="metric-card">
            <div className="mc-label">Total Defects</div>
            <div className="mc-value">1,284</div>
            <div className="mc-delta positive">↑ 12% vs last month</div>
          </div>
          <div className="metric-card">
            <div className="mc-label">Open</div>
            <div className="mc-value" style={{ color: 'var(--coral)' }}>342</div>
            <div className="mc-delta negative">↓ 8% vs last month</div>
          </div>
          <div className="metric-card">
            <div className="mc-label">Closed</div>
            <div className="mc-value" style={{ color: 'var(--green)' }}>891</div>
            <div className="mc-delta positive">↑ 5% closure rate</div>
          </div>
          <div className="metric-card">
            <div className="mc-label">Critical</div>
            <div className="mc-value" style={{ color: 'var(--amber)' }}>51</div>
            <div className="mc-delta negative">↓ 3 this week</div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <div className="cc-header">Defect Trend &mdash; Last 6 Months</div>
            <div className="bar-chart">
              <div className="bar-group">
                <div className="bar" style={{ height: '40%', opacity: 0.6 }}></div>
                <div className="bar-label">Oct</div>
              </div>
              <div className="bar-group">
                <div className="bar" style={{ height: '45%', opacity: 0.7 }}></div>
                <div className="bar-label">Nov</div>
              </div>
              <div className="bar-group">
                <div className="bar" style={{ height: '35%', opacity: 0.5 }}></div>
                <div className="bar-label">Dec</div>
              </div>
              <div className="bar-group">
                <div className="bar" style={{ height: '55%', opacity: 0.8 }}></div>
                <div className="bar-label">Jan</div>
              </div>
              <div className="bar-group">
                <div className="bar" style={{ height: '50%', opacity: 0.7 }}></div>
                <div className="bar-label">Feb</div>
              </div>
              <div className="bar-group">
                <div className="bar" style={{ height: '75%', opacity: 1.0 }}></div>
                <div className="bar-label">Mar</div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="cc-header">By Severity</div>
            <div className="donut-container">
              <div className="donut-chart">
                <div className="donut-inner"></div>
              </div>
            </div>
            <div className="donut-legend">
              <div className="dl-item">
                <div className="dl-left">
                  <div className="dl-dot" style={{ background: 'var(--coral)' }}></div>
                  <span>Critical (35%)</span>
                </div>
              </div>
              <div className="dl-item">
                <div className="dl-left">
                  <div className="dl-dot" style={{ background: 'var(--amber)' }}></div>
                  <span>High (25%)</span>
                </div>
              </div>
              <div className="dl-item">
                <div className="dl-left">
                  <div className="dl-dot" style={{ background: 'var(--teal)' }}></div>
                  <span>Medium (20%)</span>
                </div>
              </div>
              <div className="dl-item">
                <div className="dl-left">
                  <div className="dl-dot" style={{ background: 'var(--ink3)' }}></div>
                  <span>Low (20%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
