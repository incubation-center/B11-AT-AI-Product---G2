import React from "react";

export function LogosStrip() {
  return (
    <div className="logos-strip">
      <div className="logos-label">Trusted by teams using</div>
      <div style={{ overflow: "hidden", flex: 1 }}>
        <div className="logos-scroll">
          <div className="logo-item">
            <span style={{ background: "rgba(38,132,255,.15)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#2684FF">
                <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h3.45V2.85c0-1.58-1.28-2.85-2.85-2.85h-4.95zm-9.3 6.9c0 2.4 1.97 4.35 4.35 4.35h3.45V9.75c0-1.58-1.28-2.85-2.85-2.85H2.23zm9.3 6.9c0 2.4 1.97 4.35 4.35 4.35h3.45v-3.45c0-1.58-1.28-2.85-2.85-2.85h-4.95z" />
              </svg>
            </span>
            Jira
          </div>
          <div className="logo-item">
            <span style={{ background: "rgba(255,255,255,.06)" }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </span>
            GitHub
          </div>
          <div className="logo-item">
            <span style={{ background: "rgba(94,92,230,.15)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#5E5CE6">
                <path d="M21.5 5.5v13h-4.333v-3.25h-4.334v3.25H8.5v-13h4.333v3.25h4.334v-3.25H21.5z" />
              </svg>
            </span>
            Linear
          </div>
          <div className="logo-item">
            <span style={{ background: "rgba(0,120,212,.15)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#0078D4">
                <path d="M12 0l12 6v12l-12 6-12-6V6l12-6zm0 2.4L2.4 7.2v9.6l9.6 4.8 9.6-4.8V7.2L12 2.4z" />
              </svg>
            </span>
            Azure DevOps
          </div>
          <div className="logo-item">
            <span style={{ background: "rgba(255,49,157,.15)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF319D">
                <path d="M12 0L24 12L12 24L0 12L12 0ZM12 4.8L4.8 12L12 19.2L19.2 12L12 4.8Z" />
              </svg>
            </span>
            YouTrack
          </div>
          <div className="logo-item">
            <span style={{ background: "rgba(244,116,33,.15)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#F47421">
                <path d="M23.955 13.587l-1.342-4.135L12 22.015l11.955-8.428zM.045 13.587L1.387 9.452 12 22.015.045 13.587zM12 22.015l2.603-8.003L12 4.84l-2.603 9.172L12 22.015zM23.955 13.587L18.73 2.053l-6.73 11.534 11.955 0zM.045 13.587L5.27 2.053l6.73 11.534L.045 13.587z" />
              </svg>
            </span>
            GitLab
          </div>
          {/* Duplicate for seamless scroll */}
          <div className="logo-item">
            <span style={{ background: "rgba(38,132,255,.15)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#2684FF">
                <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h3.45V2.85c0-1.58-1.28-2.85-2.85-2.85h-4.95zm-9.3 6.9c0 2.4 1.97 4.35 4.35 4.35h3.45V9.75c0-1.58-1.28-2.85-2.85-2.85H2.23zm9.3 6.9c0 2.4 1.97 4.35 4.35 4.35h3.45v-3.45c0-1.58-1.28-2.85-2.85-2.85h-4.95z" />
              </svg>
            </span>
            Jira
          </div>
          <div className="logo-item">
            <span style={{ background: "rgba(255,255,255,.06)" }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </span>
            GitHub
          </div>
          <div className="logo-item">
            <span style={{ background: "rgba(94,92,230,.15)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#5E5CE6">
                <path d="M21.5 5.5v13h-4.333v-3.25h-4.334v3.25H8.5v-13h4.333v3.25h4.334v-3.25H21.5z" />
              </svg>
            </span>
            Linear
          </div>
          <div className="logo-item">
            <span style={{ background: "rgba(0,120,212,.15)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#0078D4">
                <path d="M12 0l12 6v12l-12 6-12-6V6l12-6zm0 2.4L2.4 7.2v9.6l9.6 4.8 9.6-4.8V7.2L12 2.4z" />
              </svg>
            </span>
            Azure DevOps
          </div>
          <div className="logo-item">
            <span style={{ background: "rgba(255,49,157,.15)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF319D">
                <path d="M12 0L24 12L12 24L0 12L12 0ZM12 4.8L4.8 12L12 19.2L19.2 12L12 4.8Z" />
              </svg>
            </span>
            YouTrack
          </div>
          <div className="logo-item">
            <span style={{ background: "rgba(244,116,33,.15)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#F47421">
                <path d="M23.955 13.587l-1.342-4.135L12 22.015l11.955-8.428zM.045 13.587L1.387 9.452 12 22.015.045 13.587zM12 22.015l2.603-8.003L12 4.84l-2.603 9.172L12 22.015zM23.955 13.587L18.73 2.053l-6.73 11.534 11.955 0zM.045 13.587L5.27 2.053l6.73 11.534L.045 13.587z" />
              </svg>
            </span>
            GitLab
          </div>
        </div>
      </div>
    </div>
  );
}
