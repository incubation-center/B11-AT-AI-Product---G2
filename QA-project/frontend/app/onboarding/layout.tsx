"use client";

import React from "react";
import Link from "next/link";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Simple Header */}
      <header className="w-full bg-white border-b border-gray-200 py-4 px-6 fixed top-0 z-10 flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#111]"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white text-base font-bold shadow-sm">
            Q
          </div>
          QA Intel
        </Link>
        <span className="text-sm font-medium text-gray-500">Account Setup</span>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center py-24 px-4 sm:px-6 lg:px-8 mt-16">
        {children}
      </main>
    </div>
  );
}
