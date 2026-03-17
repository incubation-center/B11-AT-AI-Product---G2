"use client";

import { useState, useEffect, useCallback } from "react";
import { datasets as datasetsApi, defects as defectsApi } from "@/lib/api";
import type { Dataset, Defect, DefectCreate, DefectUpdate } from "@/lib/types";
import { Topbar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2, Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Bug } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const PAGE_SIZE = 10;

const SEVERITIES = ["Critical", "High", "Medium", "Low"];
const STATUSES = ["Open", "In Progress", "Resolved", "Closed", "Reopened"];
const PRIORITIES = ["P1", "P2", "P3", "P4"];

const getSeverityColor = (severity: string | undefined) => {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "bg-destructive text-destructive-foreground";
    case "high":
      return "bg-chart-5/20 text-chart-5";
    case "medium":
      return "bg-chart-3/20 text-chart-3";
    case "low":
      return "bg-chart-2/20 text-chart-2";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

const getStatusColor = (status: string | undefined) => {
  switch (status?.toLowerCase()) {
    case "open":
      return "bg-chart-5/20 text-chart-5";
    case "in progress":
      return "bg-chart-1/20 text-chart-1";
    case "resolved":
    case "closed":
      return "bg-chart-2/20 text-chart-2";
    case "reopened":
      return "bg-chart-4/20 text-chart-4";
    default:
      return "bg-secondary text-secondary-foreground";
  }
};

interface DefectFormData {
  bug_id: string;
  title: string;
  module: string;
  severity: string;
  priority: string;
  environment: string;
  status: string;
}

const emptyForm: DefectFormData = {
  bug_id: "",
  title: "",
  module: "",
  severity: "",
  priority: "",
  environment: "",
  status: "Open",
};

export default function DefectsPage() {
  const [datasetList, setDatasetList] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<number | null>(null);
  const [defectList, setDefectList] = useState<Defect[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [defectsLoading, setDefectsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editDefect, setEditDefect] = useState<Defect | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState<DefectFormData>(emptyForm);

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

  const fetchDefects = useCallback(async () => {
    if (!selectedDataset) return;

    setDefectsLoading(true);
    try {
      const response = await defectsApi.list({
        dataset_id: selectedDataset,
        page,
        page_size: PAGE_SIZE,
        severity: severityFilter !== "all" ? severityFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search || undefined,
      });
      setDefectList(response.defects);
      setTotal(response.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load defects");
    } finally {
      setDefectsLoading(false);
    }
  }, [selectedDataset, page, severityFilter, statusFilter, search]);

  useEffect(() => {
    if (selectedDataset) {
      fetchDefects();
    }
  }, [selectedDataset, fetchDefects]);

  useEffect(() => {
    setPage(1);
  }, [selectedDataset, severityFilter, statusFilter, search]);

  const handleCreate = async () => {
    if (!selectedDataset || !form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const data: DefectCreate = {
        dataset_id: selectedDataset,
        bug_id: form.bug_id || undefined,
        title: form.title,
        module: form.module || undefined,
        severity: form.severity || undefined,
        priority: form.priority || undefined,
        environment: form.environment || undefined,
        status: form.status || undefined,
      };
      await defectsApi.create(data);
      toast.success("Defect created successfully");
      setCreateOpen(false);
      setForm(emptyForm);
      fetchDefects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create defect");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editDefect || !form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const data: DefectUpdate = {
        bug_id: form.bug_id || undefined,
        title: form.title,
        module: form.module || undefined,
        severity: form.severity || undefined,
        priority: form.priority || undefined,
        environment: form.environment || undefined,
        status: form.status || undefined,
      };
      await defectsApi.update(editDefect.defect_id, data);
      toast.success("Defect updated successfully");
      setEditDefect(null);
      setForm(emptyForm);
      fetchDefects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update defect");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      await defectsApi.delete(deleteId);
      toast.success("Defect deleted successfully");
      fetchDefects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete defect");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const openEditDialog = (defect: Defect) => {
    setForm({
      bug_id: defect.bug_id || "",
      title: defect.title,
      module: defect.module || "",
      severity: defect.severity || "",
      priority: defect.priority || "",
      environment: defect.environment || "",
      status: defect.status || "",
    });
    setEditDefect(defect);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (loading) {
    return (
      <>
        <Topbar title="Defects" description="Manage and track defects" />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Defects" description="Manage and track defects" />
      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-2">
                <Label>Dataset</Label>
                <Select
                  value={selectedDataset?.toString() ?? ""}
                  onValueChange={(value) => setSelectedDataset(Number(value))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select testcase document" />
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
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title or bug ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Severity</Label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {SEVERITIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setCreateOpen(true)} disabled={!selectedDataset}>
                <Plus className="h-4 w-4 mr-2" />
                Add Defect
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Defects Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Defects {total > 0 && `(${total})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDataset ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bug className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground">Select a testcase document</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a testcase document to view its defects
                </p>
              </div>
            ) : defectsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : defectList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bug className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground">No defects found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {search || severityFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create a defect to get started"}
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bug ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {defectList.map((defect) => (
                      <TableRow key={defect.defect_id}>
                        <TableCell className="font-mono text-sm">{defect.bug_id || "—"}</TableCell>
                        <TableCell className="max-w-xs truncate font-medium">{defect.title}</TableCell>
                        <TableCell>{defect.module || "—"}</TableCell>
                        <TableCell>
                          {defect.severity ? (
                            <Badge className={getSeverityColor(defect.severity)}>{defect.severity}</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{defect.priority || "—"}</TableCell>
                        <TableCell>
                          {defect.status ? (
                            <Badge className={getStatusColor(defect.status)}>{defect.status}</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{defect.environment || "—"}</TableCell>
                        <TableCell>
                          {defect.created_date
                            ? format(new Date(defect.created_date), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(defect)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(defect.defect_id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => !open && setCreateOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Defect</DialogTitle>
            <DialogDescription>Add a new defect to the selected testcase document</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="bug_id">Bug ID</Label>
                <Input
                  id="bug_id"
                  value={form.bug_id}
                  onChange={(e) => setForm({ ...form, bug_id: e.target.value })}
                  placeholder="BUG-001"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="module">Module</Label>
                <Input
                  id="module"
                  value={form.module}
                  onChange={(e) => setForm({ ...form, module: e.target.value })}
                  placeholder="Authentication"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Defect title"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Severity</Label>
                <Select
                  value={form.severity}
                  onValueChange={(v) => setForm({ ...form, severity: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="environment">Environment</Label>
              <Input
                id="environment"
                value={form.environment}
                onChange={(e) => setForm({ ...form, environment: e.target.value })}
                placeholder="Production, Staging, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDefect !== null} onOpenChange={(open) => !open && setEditDefect(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Defect</DialogTitle>
            <DialogDescription>Update the defect details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_bug_id">Bug ID</Label>
                <Input
                  id="edit_bug_id"
                  value={form.bug_id}
                  onChange={(e) => setForm({ ...form, bug_id: e.target.value })}
                  placeholder="BUG-001"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_module">Module</Label>
                <Input
                  id="edit_module"
                  value={form.module}
                  onChange={(e) => setForm({ ...form, module: e.target.value })}
                  placeholder="Authentication"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit_title">Title *</Label>
              <Input
                id="edit_title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Defect title"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Severity</Label>
                <Select
                  value={form.severity}
                  onValueChange={(v) => setForm({ ...form, severity: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit_environment">Environment</Label>
              <Input
                id="edit_environment"
                value={form.environment}
                onChange={(e) => setForm({ ...form, environment: e.target.value })}
                placeholder="Production, Staging, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDefect(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Defect</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this defect? This action cannot be undone.
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
