"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { AuthShell } from '../components/AuthShell';

export default function OTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // Take only the last character if multiple are entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.some(char => isNaN(Number(char)))) return;

    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    // Focus last filled input or next empty one
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <AuthShell>
      <div className="w-full max-w-md mx-auto">
        {/* Headings */}
        <div className="mb-8 text-center sm:text-left">
          <Link href="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 mb-6 transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to login
          </Link>
          <h2 className="text-3xl font-extrabold mb-2 text-[#1f1f1f] tracking-wide" style={{ fontFamily: '"Syne", sans-serif' }}>
            Check your email
          </h2>
          <p className="text-gray-500 font-medium text-sm leading-relaxed">
            We sent a 6-digit verification code to<br/>
            <span className="text-gray-800 font-bold">john@team.com</span>
          </p>
        </div>

        {/* Form */}
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          <div className="flex justify-between gap-2 sm:gap-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border border-gray-300 bg-[#f8f9fa] text-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#18a098] focus:border-transparent focus:bg-white transition-all shadow-sm"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={otp.some(digit => !digit)}
            className="w-full bg-[#1b1b1a] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify Email
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-gray-500">
          Didn&apos;t receive the code?{' '}
          <button type="button" className="text-[#18a098] hover:underline font-semibold focus:outline-none">
            Click to resend
          </button>
        </p>
      </div>
    </AuthShell>
  );
}
