"use client";

import { useState, useEffect, useRef } from "react";
import { datasets as datasetsApi } from "@/lib/api";
import type { Dataset } from "@/lib/types";
import { Topbar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Upload, Trash2, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const PAGE_SIZE = 10;

export default function DatasetsPage() {
  const [datasetList, setDatasetList] = useState<Dataset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<"manual" | "jira" | "azure_devops">("manual");
  const [githubUrl, setGithubUrl] = useState("");
  const [githubBranch, setGithubBranch] = useState("");
  const [generatingFromGithub, setGeneratingFromGithub] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDatasets = async () => {
    try {
      const response = await datasetsApi.list(page, PAGE_SIZE);
      setDatasetList(response.datasets);
      setTotal(response.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load testcase documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [page]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [".csv", ".xlsx", ".xls"];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!validTypes.includes(extension)) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setUploading(true);
    try {
      const response = await datasetsApi.upload(file, uploadType);
      toast.success(`Successfully imported ${response.defects_imported} defects`);
      setPage(1);
      fetchDatasets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleGenerateFromGithub = async () => {
    const url = githubUrl.trim();
    if (!url) {
      toast.error("Please paste a GitHub repository URL");
      return;
    }
    if (!/^https:\/\/github\.com\/.+\/.+/.test(url)) {
      toast.error("Only HTTPS GitHub URLs are supported (e.g. https://github.com/owner/repo)");
      return;
    }

    const branch = githubBranch.trim() || undefined;

    setGeneratingFromGithub(true);
    try {
      const response = await datasetsApi.generateFromGithub({
        clone_url: url,
        branch,
      });
      toast.success(`Successfully generated ${response.defects_imported} test cases`);
      setGithubUrl("");
      setGithubBranch("");
      setPage(1);
      fetchDatasets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setGeneratingFromGithub(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      await datasetsApi.delete(deleteId);
      toast.success("Testcase document deleted successfully");
      fetchDatasets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getSourceBadge = (source: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      manual: "default",
      jira: "secondary",
      azure_devops: "outline",
      github: "outline",
    };
    const labels: Record<string, string> = {
      manual: "Manual",
      jira: "Jira",
      azure_devops: "Azure DevOps",
      github: "GitHub",
    };
    return <Badge variant={variants[source] || "default"}>{labels[source] || source}</Badge>;
  };

  if (loading) {
    return (
      <>
        <Topbar title="Testcase Documents" description="Manage your testcase documents" />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Testcase Documents" description="Manage your testcase documents" />
      <div className="p-6 space-y-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload Testcase Document</CardTitle>
            <CardDescription>
              Upload a CSV or Excel file containing defect data (max 50MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-2">
                <Label>Source</Label>
                <Select
                  value={uploadType}
                  onValueChange={(v) => setUploadType(v as "manual" | "jira" | "azure_devops")}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Upload</SelectItem>
                    <SelectItem value="jira">Jira Export</SelectItem>
                    <SelectItem value="azure_devops">Azure DevOps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>File</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="w-64"
                />
              </div>
              {uploading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* GitHub Generate Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Generate from GitHub URL</CardTitle>
            <CardDescription>
              Paste a public GitHub repo HTTPS URL. We will derive testcases and create a testcase document.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-2">
                <Label>Clone URL</Label>
                <Input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  disabled={generatingFromGithub}
                  className="w-96"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Branch (optional)</Label>
                <Input
                  value={githubBranch}
                  onChange={(e) => setGithubBranch(e.target.value)}
                  placeholder="main"
                  disabled={generatingFromGithub}
                  className="w-64"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleGenerateFromGithub} disabled={generatingFromGithub}>
                  {generatingFromGithub ? "Generating..." : "Generate"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dataset List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Testcase Documents</CardTitle>
            <CardDescription>
              {total} testcase document{total !== 1 ? "s" : ""} uploaded
            </CardDescription>
          </CardHeader>
          <CardContent>
            {datasetList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground">No testcase documents yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a CSV or Excel file to get started
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Defects</TableHead>
                      <TableHead>Uploaded At</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datasetList.map((dataset) => (
                      <TableRow key={dataset.dataset_id}>
                        <TableCell className="font-medium">{dataset.file_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{dataset.file_type.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{getSourceBadge(dataset.upload_type)}</TableCell>
                        <TableCell className="text-right">{dataset.defect_count ?? "—"}</TableCell>
                        <TableCell>
                          {format(new Date(dataset.uploaded_at), "MMM d, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(dataset.dataset_id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Testcase Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this testcase document? This will also delete all associated
              defects and analytics data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
