"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useBilling } from "../../contexts/BillingContext";
import Link from "next/link";

export default function PaymentPage() {
  const router = useRouter();
  const { setPlanType, setStatus, setTrialEndDate } = useBilling();

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper date for UI today + 14 days
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 14);

  const formattedTrialEnd = endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    val = val.substring(0, 16);
    const parts = [];
    for (let i = 0; i < val.length; i += 4) {
      parts.push(val.substring(i, i + 4));
    }
    setCardNumber(parts.join(" "));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    val = val.substring(0, 4);
    if (val.length >= 3) {
      setExpiry(val.substring(0, 2) + "/" + val.substring(2));
    } else {
      setExpiry(val);
    }
  };

  const handleStartTrial = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Mock the backend API logic for checkout
    setTimeout(() => {
      setPlanType("team");
      setStatus("trialing");
      setTrialEndDate(endDate.toISOString());

      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-8 rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
      <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">
            Start your free trial
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            QA Intel Pro - 14 Days Free
          </p>
        </div>
        <div className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
          14 Days Free
        </div>
      </div>

      <div className="bg-[#f8f9fa] p-4 rounded-lg mb-8 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">
          Order Summary
        </h3>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">QA Intel Pro (Monthly)</span>
          <span className="font-medium">$79.00</span>
        </div>
        <div className="flex justify-between text-sm mb-3">
          <span className="text-gray-600">14-Day Free Trial</span>
          <span className="font-medium text-teal-600">-$79.00</span>
        </div>
        <div className="flex justify-between text-base font-bold text-[#111] pt-3 border-t border-gray-200">
          <span>Due Today</span>
          <span>$0.00</span>
        </div>
      </div>

      <form onSubmit={handleStartTrial}>
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Name on Card
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full px-3 py-2 text-sm text-black rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#18a098] focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Card Information
            </label>
            <input
              type="text"
              required
              maxLength={19}
              value={cardNumber}
              onChange={handleCardChange}
              placeholder="0000 0000 0000 0000"
              className="w-full px-3 py-2 text-sm text-black rounded-lg rounded-b-none border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#18a098] focus:border-transparent transition-all z-10 relative"
            />
            <div className="flex">
              <input
                type="text"
                required
                maxLength={5}
                value={expiry}
                onChange={handleExpiryChange}
                placeholder="MM/YY"
                className="w-1/2 px-3 py-2 text-sm text-black rounded-bl-lg border border-gray-300 border-t-0 border-r-0 focus:outline-none focus:ring-2 focus:ring-[#18a098] focus:border-transparent transition-all z-0"
              />
              <input
                type="text"
                required
                maxLength={4}
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                placeholder="CVC"
                className="w-1/2 px-3 py-2 text-sm text-black rounded-br-lg border border-gray-300 border-t-0 focus:outline-none focus:ring-2 focus:ring-[#18a098] focus:border-transparent transition-all z-0"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-[#1b1b1a] text-white font-bold py-3 px-4 rounded-lg hover:bg-black transition-colors shadow-md flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isProcessing
            ? "Processing Trial Setup..."
            : "Start 14-Day Free Trial"}
        </button>

        <p className="text-xs text-center text-gray-500 mt-4 leading-relaxed">
          Your free trial ends on{" "}
          <strong className="font-semibold text-gray-700">
            {formattedTrialEnd}
          </strong>
          . You will be automatically charged $79/month thereafter. Cancel
          anytime before the trial ends to avoid being charged.
        </p>

        <div className="mt-6 text-center">
          <Link
            href="/onboarding/plan-selection"
            className="text-xs text-teal-600 hover:underline font-medium"
          >
            ← Back to plan selection
          </Link>
        </div>
      </form>
    </div>
  );
}
