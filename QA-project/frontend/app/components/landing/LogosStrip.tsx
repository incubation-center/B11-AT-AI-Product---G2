import React from 'react';

export function LogosStrip() {
  return (
    <div className="logos-strip">
      <div className="logos-label">Trusted by teams using</div>
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div className="logos-scroll">
          <div className="logo-item"><span style={{ background: 'rgba(255,165,0,.15)' }}>🟠</span>Jira</div>
          <div className="logo-item"><span style={{ background: 'rgba(255,255,255,.06)' }}>⚫</span>GitHub Issues</div>
          <div className="logo-item"><span style={{ background: 'rgba(74,144,226,.15)' }}>🔵</span>Linear</div>
          <div className="logo-item"><span style={{ background: 'rgba(76,175,80,.15)' }}>🟢</span>Azure DevOps</div>
          <div className="logo-item"><span style={{ background: 'rgba(255,165,0,.15)' }}>🟡</span>YouTrack</div>
          <div className="logo-item"><span style={{ background: 'rgba(255,255,255,.06)' }}>⬛</span>GitLab</div>
          <div className="logo-item"><span style={{ background: 'rgba(255,165,0,.15)' }}>🟠</span>Jira</div>
          <div className="logo-item"><span style={{ background: 'rgba(255,255,255,.06)' }}>⚫</span>GitHub Issues</div>
          <div className="logo-item"><span style={{ background: 'rgba(74,144,226,.15)' }}>🔵</span>Linear</div>
          <div className="logo-item"><span style={{ background: 'rgba(76,175,80,.15)' }}>🟢</span>Azure DevOps</div>
        </div>
      </div>
    </div>
  );
}
