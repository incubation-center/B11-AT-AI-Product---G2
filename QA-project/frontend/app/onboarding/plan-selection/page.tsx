"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useBilling } from "../../contexts/BillingContext";

export default function PlanSelectionPage() {
  const router = useRouter();
  const { setPlanType, setStatus, setTrialEndDate } = useBilling();
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro">("pro");

  const handleContinue = () => {
    if (selectedPlan === "starter") {
      setPlanType("starter");
      setStatus("active");
      setTrialEndDate(undefined);
      router.push("/dashboard");
    } else {
      router.push("/onboarding/payment");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center animate-fade-in">
      <h1 className="text-3xl font-extrabold text-[#111] mb-2 tracking-tight">
        Choose your workspace plan
      </h1>
      <p className="text-gray-500 mb-10 text-center max-w-xl">
        Get started for free or upgrade to Pro to unlock advanced AI analysis,
        unlimited defects, and team collaboration.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Starter Plan */}
        <div
          onClick={() => setSelectedPlan("starter")}
          className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
            selectedPlan === "starter"
              ? "border-teal-600 bg-teal-50/30"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          {selectedPlan === "starter" && (
            <div className="absolute top-4 right-4 text-teal-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          <h2 className="text-xl font-bold text-[#111] mb-2">Basic Core</h2>
          <p className="text-sm text-gray-500 mb-6">
            For small teams getting started with basic analytics.
          </p>
          <div className="mb-6">
            <span className="text-4xl font-extrabold text-[#111]">$0</span>
            <span className="text-gray-500 text-sm">/mo</span>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center text-sm text-gray-700">
              <svg
                className="w-5 h-5 text-gray-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              1 dataset limit
            </li>
            <li className="flex items-center text-sm text-gray-700">
              <svg
                className="w-5 h-5 text-gray-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Up to 500 defect rows
            </li>
            <li className="flex items-center text-sm text-gray-700">
              <svg
                className="w-5 h-5 text-gray-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Basic AI Chat (20 queries/mo)
            </li>
            <li className="flex items-center text-sm text-gray-700">
              <svg
                className="w-5 h-5 text-gray-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Single user
            </li>
          </ul>
        </div>

        {/* Pro Plan */}
        <div
          onClick={() => setSelectedPlan("pro")}
          className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all shadow-sm ${
            selectedPlan === "pro"
              ? "border-teal-600 bg-teal-50/10"
              : "border-teal-200 bg-white hover:border-teal-300"
          }`}
        >
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            Recommended
          </div>
          {selectedPlan === "pro" && (
            <div className="absolute top-4 right-4 text-teal-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          <h2 className="text-xl font-bold text-[#111] mb-2">QA Intel Pro</h2>
          <p className="text-sm text-gray-500 mb-6">
            Advanced AI Analysis & Predictive Reports for teams.
          </p>
          <div className="mb-6">
            <span className="text-4xl font-extrabold text-[#111]">$79</span>
            <span className="text-gray-500 text-sm">/mo</span>
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
              14-Day Free Trial
            </span>
          </div>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center text-sm text-gray-700">
              <svg
                className="w-5 h-5 text-teal-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Unlimited datasets & storage
            </li>
            <li className="flex items-center text-sm text-gray-700">
              <svg
                className="w-5 h-5 text-teal-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Unlimited defect tracking
            </li>
            <li className="flex items-center text-sm text-gray-700">
              <svg
                className="w-5 h-5 text-teal-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Advanced AI Chat & Risk Prediction
            </li>
            <li className="flex items-center text-sm text-gray-700">
              <svg
                className="w-5 h-5 text-teal-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Invite up to 10 team members
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-10 w-full max-w-sm flex flex-col gap-4">
        <button
          onClick={handleContinue}
          className="w-full bg-[#1b1b1a] text-white font-bold py-3.5 px-4 rounded-lg hover:bg-black transition-colors flex justify-center items-center shadow-md"
        >
          {selectedPlan === "pro"
            ? "Start 14-Day Free Trial"
            : "Continue with Starter"}
        </button>
        {selectedPlan === "pro" && (
          <p className="text-xs text-center text-gray-500">
            You won&apos;t be charged until your trial ends. Cancel anytime.
          </p>
        )}
      </div>
    </div>
  );
}
