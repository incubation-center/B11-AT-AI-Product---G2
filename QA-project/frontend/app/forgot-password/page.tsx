"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '../components/AuthShell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // TODO: Wire up to actual forgot password API
  };

  return (
    <AuthShell>
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6 text-center sm:text-left">
          <Link href="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-6 group">
            <svg className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to login
          </Link>

          <h2 className="text-3xl font-extrabold mb-2 text-[#1f1f1f] tracking-wide" style={{ fontFamily: '"Syne", sans-serif' }}>
            Forgot password
          </h2>
          <p className="text-gray-500 font-medium text-lg">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        {submitted ? (
          <div className="bg-[#f0f9f8] border border-[#18a098] rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-[#18a098] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#1f1f1f] mb-2">Check your email</h3>
            <p className="text-gray-600 text-sm mb-6">
              We sent a password reset link to <br/>
              <span className="font-semibold text-[#1f1f1f]">{email}</span>
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-2 text-sm font-semibold text-[#18a098] hover:text-[#138079]"
            >
              Didn't receive the email? Click to resend
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 block mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@team.com"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-[#f8f9fa] text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#18a098] focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#1b1b1a] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-black transition-colors mt-4"
            >
              Reset password
            </button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
