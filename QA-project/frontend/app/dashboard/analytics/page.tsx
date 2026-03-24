"use client";

import { useState, useEffect, useCallback } from "react";
import { datasets as datasetsApi, analytics } from "@/lib/api";
import type {
  Dataset,
  SeverityResponse,
  ResolutionTimeResponse,
  ReopenRateResponse,
  LeakageResponse,
  ModuleRisksResponse,
  SeverityResolutionResponse,
} from "@/lib/types";
import { Topbar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Play, Clock, RotateCcw, AlertTriangle, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const getRiskBadge = (riskLevel: string) => {
  switch (riskLevel?.toLowerCase()) {
    case "critical":
      return <Badge className="bg-destructive text-destructive-foreground">Critical</Badge>;
    case "high":
      return <Badge className="bg-chart-5/20 text-chart-5">High</Badge>;
    case "medium":
      return <Badge className="bg-chart-3/20 text-chart-3">Medium</Badge>;
    case "low":
      return <Badge className="bg-chart-2/20 text-chart-2">Low</Badge>;
    default:
      return <Badge variant="secondary">{riskLevel || "Unknown"}</Badge>;
  }
};

export default function AnalyticsPage() {
  const [datasetList, setDatasetList] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const [severity, setSeverity] = useState<SeverityResponse | null>(null);
  const [resolutionTime, setResolutionTime] = useState<ResolutionTimeResponse | null>(null);
  const [reopenRate, setReopenRate] = useState<ReopenRateResponse | null>(null);
  const [leakage, setLeakage] = useState<LeakageResponse | null>(null);
  const [moduleRisks, setModuleRisks] = useState<ModuleRisksResponse | null>(null);
  const [severityResolution, setSeverityResolution] = useState<SeverityResolutionResponse | null>(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await datasetsApi.list(1, 100);
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

  const fetchAnalytics = useCallback(async () => {
    if (!selectedDataset) return;

    setDataLoading(true);
    try {
      const [
        severityData,
        resolutionData,
        reopenData,
        leakageData,
        moduleRisksData,
        severityResData,
      ] = await Promise.all([
        analytics.severity(selectedDataset).catch(() => null),
        analytics.resolutionTime(selectedDataset).catch(() => null),
        analytics.reopenRate(selectedDataset).catch(() => null),
        analytics.leakage(selectedDataset).catch(() => null),
        analytics.moduleRisks(selectedDataset).catch(() => null),
        analytics.severityResolution(selectedDataset).catch(() => null),
      ]);

      setSeverity(severityData);
      setResolutionTime(resolutionData);
      setReopenRate(reopenData);
      setLeakage(leakageData);
      setModuleRisks(moduleRisksData);
      setSeverityResolution(severityResData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load analytics");
    } finally {
      setDataLoading(false);
    }
  }, [selectedDataset]);

  useEffect(() => {
    if (selectedDataset) {
      fetchAnalytics();
    }
  }, [selectedDataset, fetchAnalytics]);

  const handleCompute = async () => {
    if (!selectedDataset) return;

    setComputing(true);
    try {
      const result = await analytics.compute(selectedDataset);
      toast.success(result.message || "Analytics computed successfully");
      fetchAnalytics();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to compute analytics");
    } finally {
      setComputing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Topbar title="Analytics" description="Deep dive into your QA metrics" />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Analytics" description="Deep dive into your QA metrics" />
      <div className="p-6 space-y-6">
        {/* Dataset Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-2">
                <Label>Testcase Document</Label>
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
              </div>
              <Button
                onClick={handleCompute}
                disabled={!selectedDataset || computing}
                className="mt-auto"
              >
                {computing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Computing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Compute Analytics
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedDataset && (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-chart-1/20 p-2">
                      <Clock className="h-5 w-5 text-chart-1" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
                      <p className="text-2xl font-bold text-foreground">
                        {dataLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : resolutionTime?.avg_days != null ? (
                          `${resolutionTime.avg_days.toFixed(1)} days`
                        ) : (
                          "—"
                        )}
                      </p>
                      {resolutionTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Min: {resolutionTime.min_days?.toFixed(1) ?? "—"} | Max: {resolutionTime.max_days?.toFixed(1) ?? "—"}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-chart-4/20 p-2">
                      <RotateCcw className="h-5 w-5 text-chart-4" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reopen Rate</p>
                      <p className="text-2xl font-bold text-foreground">
                        {dataLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : reopenRate?.reopen_rate_percent != null ? (
                          `${reopenRate.reopen_rate_percent.toFixed(1)}%`
                        ) : (
                          "—"
                        )}
                      </p>
                      {reopenRate && (
                        <Badge
                          className={
                            reopenRate.quality_indicator === "Good"
                              ? "bg-chart-2/20 text-chart-2"
                              : reopenRate.quality_indicator === "Acceptable"
                              ? "bg-chart-3/20 text-chart-3"
                              : "bg-destructive/20 text-destructive"
                          }
                        >
                          {reopenRate.quality_indicator}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-chart-5/20 p-2">
                      <AlertTriangle className="h-5 w-5 text-chart-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Defect Leakage</p>
                      <p className="text-2xl font-bold text-foreground">
                        {dataLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : leakage?.leakage_rate_percent != null ? (
                          `${leakage.leakage_rate_percent.toFixed(1)}%`
                        ) : (
                          "—"
                        )}
                      </p>
                      {leakage && getRiskBadge(leakage.risk_level)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
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
                        <XAxis
                          dataKey="severity"
                          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                        />
                        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "var(--foreground)" }}
                        />
                        <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mb-4" />
                      <p>No severity data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Environment Leakage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Environment Leakage</CardTitle>
                  <CardDescription>Defects leaked to production by environment</CardDescription>
                </CardHeader>
                <CardContent>
                  {dataLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : leakage && leakage.environment_breakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={leakage.environment_breakdown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                          dataKey="environment"
                          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                        />
                        <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                          }}
                          labelStyle={{ color: "var(--foreground)" }}
                        />
                        <Bar dataKey="count" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mb-4" />
                      <p>No leakage data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Severity vs Resolution Time */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Severity vs Resolution Time</CardTitle>
                <CardDescription>Average resolution time by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : severityResolution && severityResolution.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={severityResolution.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="severity"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      />
                      <YAxis
                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                        label={{
                          value: "Days",
                          angle: -90,
                          position: "insideLeft",
                          fill: "var(--muted-foreground)",
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "var(--foreground)" }}
                      />
                      <Legend
                        formatter={(value) => (
                          <span style={{ color: "var(--foreground)" }}>{value}</span>
                        )}
                      />
                      <Bar
                        dataKey="avg_resolution_days"
                        name="Avg Days"
                        fill="var(--chart-1)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="min_resolution_days"
                        name="Min Days"
                        fill="var(--chart-2)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="max_resolution_days"
                        name="Max Days"
                        fill="var(--chart-5)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mb-4" />
                    <p>No resolution time data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Module Risk Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Module Risk Scores</CardTitle>
                <CardDescription>Risk assessment by module</CardDescription>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : moduleRisks && moduleRisks.modules.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Module</TableHead>
                        <TableHead className="text-right">Bug Count</TableHead>
                        <TableHead className="text-right">Reopen Rate</TableHead>
                        <TableHead className="text-right">Risk Score</TableHead>
                        <TableHead>Risk Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {moduleRisks.modules.map((module) => (
                        <TableRow key={module.risk_id}>
                          <TableCell className="font-medium">{module.module_name}</TableCell>
                          <TableCell className="text-right">{module.bug_count}</TableCell>
                          <TableCell className="text-right">
                            {module.reopen_rate != null
                              ? `${(module.reopen_rate * 100).toFixed(1)}%`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {module.risk_score?.toFixed(2) ?? "—"}
                          </TableCell>
                          <TableCell>{getRiskBadge(module.risk_level)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <p>No module risk data available</p>
                    <p className="text-sm mt-1">Click Compute Analytics to generate data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
