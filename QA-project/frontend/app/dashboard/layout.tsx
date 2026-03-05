"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './dashboard.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="dashboard-root">
      <aside className="dash-sidebar">
        <Link href="/dashboard" className="dash-logo">
          <div className="dash-logo-mark">Q</div>
          QA Intel
        </Link>

        <nav className="dash-nav">
          <Link 
            href="/dashboard" 
            className={`dash-nav-item ${pathname === '/dashboard' ? 'active' : ''}`}
          >
            <span className="dash-nav-icon">📊</span>
            Dashboard
          </Link>
          <Link 
            href="/dashboard/upload" 
            className={`dash-nav-item ${pathname === '/dashboard/upload' ? 'active' : ''}`}
          >
            <span className="dash-nav-icon">📁</span>
            Upload Data
          </Link>
          <Link 
            href="/dashboard/explorer" 
            className={`dash-nav-item ${pathname === '/dashboard/explorer' ? 'active' : ''}`}
          >
            <span className="dash-nav-icon">🔍</span>
            Explorer
          </Link>
          <Link 
            href="/dashboard/chat" 
            className={`dash-nav-item ${pathname === '/dashboard/chat' ? 'active' : ''}`}
          >
            <span className="dash-nav-icon">🤖</span>
            AI Chat
          </Link>
          <Link 
            href="/dashboard/reports" 
            className={`dash-nav-item ${pathname === '/dashboard/reports' ? 'active' : ''}`}
          >
            <span className="dash-nav-icon">📈</span>
            Reports
          </Link>
        </nav>

        <div className="dash-bottom-nav">
          <Link 
            href="/dashboard/settings" 
            className={`dash-nav-item ${pathname === '/dashboard/settings' ? 'active' : ''}`}
          >
            <span className="dash-nav-icon">⚙️</span>
            Settings
          </Link>
        </div>
      </aside>

      <main className="dash-main">
        {children}
      </main>
    </div>
  );
}
