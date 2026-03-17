"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { datasets, analytics } from "@/lib/api";
import type { Dataset, DefectSummary, SeverityResponse } from "@/lib/types";
import { Topbar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bug, AlertCircle, Clock, CheckCircle, RotateCcw, XCircle, BarChart3, BotMessageSquare, FileText } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const STATUS_COLORS: Record<string, string> = {
  open: "hsl(var(--chart-5))",
  in_progress: "hsl(var(--chart-1))",
  closed: "hsl(var(--chart-2))",
  reopened: "hsl(var(--chart-4))",
  unresolved: "hsl(var(--destructive))",
};

export default function DashboardPage() {
  const [datasetList, setDatasetList] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<number | null>(null);
  const [summary, setSummary] = useState<DefectSummary | null>(null);
  const [severity, setSeverity] = useState<SeverityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

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
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="severity" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "hsl(var(--foreground))" }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
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
                <CardHeader>
                  <CardTitle className="text-base">Defect Status</CardTitle>
                  <CardDescription>Distribution by current status</CardDescription>
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
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend
                          formatter={(value) => <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>}
                        />
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
            <Link key={link.href} href={link.href}>
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
