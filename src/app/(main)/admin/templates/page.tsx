"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Check, X, Trash2 } from "lucide-react";

interface Template {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  downloads: number;
  rating: number;
  creator: { id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "delete">("approve");
  const [rejectReason, setRejectReason] = useState("");

  const statusColors: Record<string, string> = {
    PENDING: "yellow",
    APPROVED: "green",
    REJECTED: "red"
  };

  const fetchTemplates = async (page: number = 1, search: string = "", status: string = "PENDING") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        status,
        ...(search && { search })
      });
      const response = await fetch(`/api/admin/templates?${params}`);
      const data = await response.json();
      setTemplates(data.templates);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Failed to load templates");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTemplates(1, searchQuery, statusFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  const handleAction = async () => {
    if (!selectedTemplate) return;
    try {
      const response = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          templateId: selectedTemplate.id, 
          action: actionType 
        })
      });
      if (!response.ok) throw new Error("Failed to perform action");
      toast.success(`Template ${actionType}d successfully`);
      setActionDialogOpen(false);
      fetchTemplates(pagination.page, searchQuery, statusFilter);
      setRejectReason("");
    } catch (error) {
      toast.error("Failed to perform action");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Template Moderation</h1>
        <p className="text-gray-600">Review and approve user templates</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Templates ({pagination.total})</CardTitle>
          <CardDescription>Total: {pagination.total} | Page {pagination.page} of {pagination.totalPages}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Creator</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.title}</TableCell>
                        <TableCell>{template.creator.name}</TableCell>
                        <TableCell>${template.price}</TableCell>
                        <TableCell>
                          <Badge variant={
                            template.status === "APPROVED" ? "default" :
                            template.status === "REJECTED" ? "destructive" :
                            "secondary"
                          }>
                            {template.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{template.downloads}</TableCell>
                        <TableCell>{template.rating.toFixed(1)}★</TableCell>
                        <TableCell className="flex gap-2">
                          {template.status === "PENDING" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTemplate(template);
                                  setActionType("approve");
                                  setActionDialogOpen(true);
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTemplate(template);
                                  setActionType("reject");
                                  setActionDialogOpen(true);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setActionType("delete");
                              setActionDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Showing {templates.length} of {pagination.total} results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTemplates(Math.max(1, pagination.page - 1), searchQuery, statusFilter)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-2 text-sm">{pagination.page} / {pagination.totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTemplates(Math.min(pagination.totalPages, pagination.page + 1), searchQuery, statusFilter)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approve Template" :
               actionType === "reject" ? "Reject Template" :
               "Delete Template"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTemplate?.title}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {actionType === "reject" && (
            <div className="py-4">
              <Textarea
                placeholder="Reason for rejection (optional)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-24"
              />
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={actionType === "delete" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {actionType === "approve" ? "Approve" :
               actionType === "reject" ? "Reject" :
               "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
