"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "../ThemeToggle";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      style={{
        borderBottom: scrolled
          ? "1px solid var(--border2)"
          : "1px solid transparent",
        backgroundColor: scrolled ? "var(--surface2)" : "transparent",
      }}
    >
      <Link href="/" className="nav-logo">
        <div className="nav-logo-mark">Q</div>
        QA Intelligence
      </Link>
      <div className="nav-links">
        <a href="#features">Features</a>
        <a href="#how">How it works</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
      </div>
      <div className="nav-cta-group">
        <ThemeToggle className="hover:text-[var(--ink)]" />
        <Link href="/login" className="btn-ghost">
          Sign in
        </Link>
        <Link href="/signup" className="btn-primary">
          Start free trial &rarr;
        </Link>
      </div>
    </nav>
  );
}
