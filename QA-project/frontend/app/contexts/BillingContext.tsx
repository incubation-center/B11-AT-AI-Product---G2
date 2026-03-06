"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type PlanType = "starter" | "team";

export interface UsageData {
  datasetsCount: number;
  totalDefects: number;
  aiQueriesUsed: number;
}

interface BillingContextType {
  planType: PlanType;
  status: "active" | "trialing" | "canceled";
  trialEndDate?: string;
  usage: UsageData;
  setPlanType: (plan: PlanType) => void;
  setStatus: (status: "active" | "trialing" | "canceled") => void;
  setTrialEndDate: (date: string | undefined) => void;
  setUsage: (usage: UsageData | ((prev: UsageData) => UsageData)) => void;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: ReactNode }) {
  // We mock a starter state by default
  const [planType, setPlanType] = useState<PlanType>("starter");
  const [status, setStatus] = useState<"active" | "trialing" | "canceled">(
    "active",
  );
  const [trialEndDate, setTrialEndDate] = useState<string | undefined>(
    undefined,
  );

  // Notice that datasetsCount is 1 and aiQueries is 18 to demonstrate limits
  const [usage, setUsage] = useState<UsageData>({
    datasetsCount: 1,
    totalDefects: 380,
    aiQueriesUsed: 19,
  });

  return (
    <BillingContext.Provider
      value={{
        planType,
        status,
        trialEndDate,
        usage,
        setPlanType,
        setStatus,
        setTrialEndDate,
        setUsage,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error("useBilling must be used within a BillingProvider");
  }
  return context;
}
