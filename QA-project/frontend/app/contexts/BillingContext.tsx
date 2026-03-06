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
  usage: UsageData;
  setPlanType: (plan: PlanType) => void;
  setUsage: (usage: UsageData | ((prev: UsageData) => UsageData)) => void;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: ReactNode }) {
  // We mock a starter state by default
  const [planType, setPlanType] = useState<PlanType>("starter");

  // Notice that datasetsCount is 1 and aiQueries is 18 to demonstrate limits
  const [usage, setUsage] = useState<UsageData>({
    datasetsCount: 1,
    totalDefects: 380,
    aiQueriesUsed: 19,
  });

  return (
    <BillingContext.Provider value={{ planType, usage, setPlanType, setUsage }}>
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
