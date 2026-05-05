"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { datasets, analytics } from "@/lib/api";
import type { Dataset, DefectSummary, SeverityResponse } from "@/lib/types";
import { Topbar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bug, AlertCircle, Clock, CheckCircle, RotateCcw, XCircle, BarChart3, BotMessageSquare, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label, Sector } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";

/** Theme tokens are full colors (oklch) — use var() directly, not hsl(var(...)). */
const STATUS_COLORS: Record<string, string> = {
  open: "var(--chart-5)",
  in_progress: "var(--chart-1)",
  closed: "var(--chart-2)",
  reopened: "var(--chart-4)",
  unresolved: "var(--destructive)",
};

export default function DashboardPage() {
  const [datasetList, setDatasetList] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<number | null>(null);
  const [summary, setSummary] = useState<DefectSummary | null>(null);
  const [severity, setSeverity] = useState<SeverityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeStatus, setActiveStatus] = useState<string>("");

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await datasets.list(1, 100);
        setDatasetList(response.datasets);
        if (response.datasets.length > 0) {
          setSelectedDataset(response.datasets[0].dataset_id);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load testcase documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, []);

  useEffect(() => {
    if (!selectedDataset) return;

    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [summaryData, severityData] = await Promise.all([
          analytics.summary(selectedDataset),
          analytics.severity(selectedDataset),
        ]);
        setSummary(summaryData);
        setSeverity(severityData);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load analytics");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [selectedDataset]);

  const statusData = summary
    ? [
        { name: "Open", value: summary.open, fill: STATUS_COLORS.open },
        { name: "In Progress", value: summary.in_progress, fill: STATUS_COLORS.in_progress },
        { name: "Closed", value: summary.closed, fill: STATUS_COLORS.closed },
        { name: "Reopened", value: summary.reopened, fill: STATUS_COLORS.reopened },
        { name: "Unresolved", value: summary.unresolved, fill: STATUS_COLORS.unresolved },
      ]
    : [];

  useEffect(() => {
    if (statusData.length === 0) {
      setActiveStatus("");
      return;
    }

    if (!statusData.some((item) => item.name === activeStatus)) {
      const firstAvailableStatus = statusData.find((item) => item.value > 0)?.name ?? statusData[0].name;
      setActiveStatus(firstAvailableStatus);
    }
  }, [statusData, activeStatus]);

  const activeStatusIndex = useMemo(
    () => statusData.findIndex((item) => item.name === activeStatus),
    [statusData, activeStatus]
  );

  const activeStatusSlice =
    activeStatusIndex >= 0 ? statusData[activeStatusIndex] : statusData[0] ?? { name: "Status", value: 0, fill: "var(--muted)" };

  const renderStatusPieShape = useCallback(
    ({ index, outerRadius = 0, ...props }: PieSectorDataItem & { index?: number }) => {
      const baseRadius = typeof outerRadius === "number" ? outerRadius : Number(outerRadius) || 0;

      return (
        <g>
          <Sector {...props} outerRadius={baseRadius + 8} />
          <Sector {...props} outerRadius={baseRadius + 20} innerRadius={baseRadius + 10} />
        </g>
      );
    },
    []
  );

  const statCards = [
    { title: "Total Defects", value: summary?.total ?? 0, icon: Bug, color: "text-foreground" },
    { title: "Open", value: summary?.open ?? 0, icon: AlertCircle, color: "text-chart-5" },
    { title: "In Progress", value: summary?.in_progress ?? 0, icon: Clock, color: "text-chart-1" },
    { title: "Closed", value: summary?.closed ?? 0, icon: CheckCircle, color: "text-chart-2" },
    { title: "Reopened", value: summary?.reopened ?? 0, icon: RotateCcw, color: "text-chart-4" },
    { title: "Unresolved", value: summary?.unresolved ?? 0, icon: XCircle, color: "text-destructive" },
  ];

  const quickLinks = [
    { title: "Analytics", description: "Deep dive into metrics", href: "/dashboard/analytics", icon: BarChart3 },
    { title: "AI Chat", description: "Ask AI about defects", href: "/dashboard/ai-chat", icon: BotMessageSquare },
    { title: "Reports", description: "Generate reports", href: "/dashboard/reports", icon: FileText },
    { title: "Telegram Bot", description: "Chat on your phone", href: "https://t.me/QAChatbot", icon: Send },
  ];

  if (loading) {
    return (
      <>
        <Topbar title="Dashboard" description="Overview of your QA analytics" />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Dashboard" description="Overview of your QA analytics" />
      <div className="p-6 space-y-6">
        {/* Dataset Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-foreground">Select Testcase Document:</label>
              <Select
                value={selectedDataset?.toString() ?? ""}
                onValueChange={(value) => setSelectedDataset(Number(value))}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a testcase document" />
                </SelectTrigger>
                <SelectContent>
                  {datasetList.map((dataset) => (
                    <SelectItem key={dataset.dataset_id} value={dataset.dataset_id.toString()}>
                      {dataset.file_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {datasetList.length === 0 && (
                <Link href="/dashboard/datasets">
                  <Badge variant="secondary" className="cursor-pointer">
                    Upload a testcase document to get started
                  </Badge>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedDataset && (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map((stat) => (
                <Card key={stat.title}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <stat.icon className={`h-6 w-6 mb-2 ${stat.color}`} />
                      <p className="text-2xl font-bold text-foreground">
                        {dataLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stat.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Severity Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Severity Distribution</CardTitle>
                  <CardDescription>Defects by severity level</CardDescription>
                </CardHeader>
                <CardContent>
                  {dataLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : severity && severity.distribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={severity.distribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="severity" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111827",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#ffffff",
                            padding: "8px",
                            fill: "#ffffff",
                          }}
                          labelStyle={{ color: "#ffffff", fontWeight: "500", fill: "#ffffff" }}
                          itemStyle={{ color: "#ffffff" }}
                          cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
                        />
                        <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      No severity data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <Card>
                <CardHeader className="relative space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">Defect Status</CardTitle>
                    <CardDescription>Distribution by current status</CardDescription>
                  </div>
                  <Select value={activeStatus} onValueChange={setActiveStatus}>
                    <SelectTrigger className="absolute right-6 top-6 h-8 w-37.5 rounded-md">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {statusData.map((item) => (
                        <SelectItem key={item.name} value={item.name}>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                            {item.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  {dataLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : summary && summary.total > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          strokeWidth={3}
                          activeShape={renderStatusPieShape}
                          onMouseEnter={(_, index) => {
                            if (statusData[index]) {
                              setActiveStatus(statusData[index].name);
                            }
                          }}
                          onClick={(_, index) => {
                            if (statusData[index]) {
                              setActiveStatus(statusData[index].name);
                            }
                          }}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}

                          <Label
                            content={({ viewBox }) => {
                              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                return (
                                  <text
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                  >
                                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                                      {activeStatusSlice.value.toLocaleString()}
                                    </tspan>
                                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 22} className="fill-muted-foreground">
                                      {activeStatusSlice.name}
                                    </tspan>
                                  </text>
                                );
                              }
                              return null;
                            }}
                          />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      No status data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              target={link.href.includes("t.me") ? "_blank" : undefined}
              rel={link.href.includes("t.me") ? "noopener noreferrer" : undefined}
            >
              <Card className="hover:bg-secondary/50 transition-colors cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-secondary p-2">
                      <link.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{link.title}</h3>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
