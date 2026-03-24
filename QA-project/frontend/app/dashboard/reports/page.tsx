"use client";

import { useState, useEffect, useCallback } from "react";
import { datasets as datasetsApi, reports } from "@/lib/api";
import type { Dataset, ReportMeta } from "@/lib/types";
import { Topbar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, Download, FileSpreadsheet, FileBadge } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const getFormatIcon = (format: string) => {
  switch (format) {
    case "pdf":
      return <FileBadge className="h-4 w-4 text-destructive" />;
    case "csv":
      return <FileText className="h-4 w-4 text-chart-2" />;
    case "excel":
      return <FileSpreadsheet className="h-4 w-4 text-chart-2" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getFormatBadge = (format: string) => {
  switch (format) {
    case "pdf":
      return <Badge className="bg-destructive/20 text-destructive">PDF</Badge>;
    case "csv":
      return <Badge className="bg-chart-2/20 text-chart-2">CSV</Badge>;
    case "excel":
      return <Badge className="bg-chart-2/20 text-chart-2">Excel</Badge>;
    default:
      return <Badge variant="secondary">{format.toUpperCase()}</Badge>;
  }
};

export default function ReportsPage() {
  const [datasetList, setDatasetList] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<number | null>(null);
  const [reportFormat, setReportFormat] = useState<"pdf" | "csv" | "excel">("pdf");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportList, setReportList] = useState<ReportMeta[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

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

  const fetchReports = useCallback(async () => {
    if (!selectedDataset) return;

    setReportsLoading(true);
    try {
      const response = await reports.list(selectedDataset);
      setReportList(response.reports);
    } catch {
      // Reports might not exist yet
      setReportList([]);
    } finally {
      setReportsLoading(false);
    }
  }, [selectedDataset]);

  useEffect(() => {
    if (selectedDataset) {
      fetchReports();
    }
  }, [selectedDataset, fetchReports]);

  const handleGenerate = async () => {
    if (!selectedDataset) return;

    setGenerating(true);
    try {
      const response = await reports.generate({
        dataset_id: selectedDataset,
        format: reportFormat,
      });
      toast.success(response.message || "Report generated successfully");
      fetchReports();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportId: number, fallbackFileName: string) => {
    try {
      const { blob, filename } = await reports.download(reportId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || fallbackFileName || `report-${reportId}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download report");
    }
  };

  if (loading) {
    return (
      <>
        <Topbar title="Reports" description="Generate and download reports" />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Reports" description="Generate and download reports" />
      <div className="p-6 space-y-6">
        {/* Generate Report */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generate Report</CardTitle>
            <CardDescription>
              Create a new report for your defect data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
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
              <div className="flex flex-col gap-2">
                <Label>Format</Label>
                <Select
                  value={reportFormat}
                  onValueChange={(v) => setReportFormat(v as "pdf" | "csv" | "excel")}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileBadge className="h-4 w-4" />
                        PDF
                      </div>
                    </SelectItem>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        CSV
                      </div>
                    </SelectItem>
                    <SelectItem value="excel">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!selectedDataset || generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report History</CardTitle>
            <CardDescription>
              Previously generated reports for this testcase document
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedDataset ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground">Select a testcase document</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a testcase document to view its reports
                </p>
              </div>
            ) : reportsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : reportList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground">No reports yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate a report to see it here
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Type</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Generated At</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportList.map((report) => (
                    <TableRow key={report.report_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFormatIcon(report.report_type)}
                          {getFormatBadge(report.report_type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{report.file_name}</TableCell>
                      <TableCell>
                        {format(new Date(report.generated_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(report.report_id, report.file_name)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
