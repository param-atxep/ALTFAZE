"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AdminLog {
  id: string;
  action: string;
  admin: { id: string; name: string; email: string };
  targetId: string | null;
  targetType: string | null;
  description: string;
  metadata: string | null;
  createdAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const actionColors: Record<string, string> = {
  USER_BLOCKED: "warning",
  USER_DELETED: "destructive",
  TEMPLATE_APPROVED: "success",
  TEMPLATE_REJECTED: "warning",
  TEMPLATE_DELETED: "destructive",
  PROJECT_REMOVED: "destructive",
  WITHDRAWAL_APPROVED: "success",
  WITHDRAWAL_REJECTED: "warning",
  OTHER: "secondary",
};

export default function AdminLogs() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, limit: 50, totalPages: 0 });
  const [actionFilter, setActionFilter] = useState<string>("");

  const fetchLogs = async (page: number = 1, action: string = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        ...(action && { action })
      });
      const response = await fetch(`/api/admin/logs?${params}`);
      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Failed to load logs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, actionFilter);
  }, [actionFilter]);

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Audit Logs</h1>
        <p className="text-gray-600">Track all admin actions and changes</p>
      </div>

      {/* Action Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actions</SelectItem>
              <SelectItem value="USER_BLOCKED">User Blocked</SelectItem>
              <SelectItem value="USER_DELETED">User Deleted</SelectItem>
              <SelectItem value="TEMPLATE_APPROVED">Template Approved</SelectItem>
              <SelectItem value="TEMPLATE_REJECTED">Template Rejected</SelectItem>
              <SelectItem value="TEMPLATE_DELETED">Template Deleted</SelectItem>
              <SelectItem value="PROJECT_REMOVED">Project Removed</SelectItem>
              <SelectItem value="WITHDRAWAL_APPROVED">Withdrawal Approved</SelectItem>
              <SelectItem value="WITHDRAWAL_REJECTED">Withdrawal Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs ({pagination.total})</CardTitle>
          <CardDescription>Page {pagination.page} of {pagination.totalPages}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{log.admin.name}</p>
                            <p className="text-xs text-gray-500">{log.admin.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            log.action.includes("APPROVED") ? "default" :
                            log.action.includes("DELETED") || log.action.includes("REMOVED") ? "destructive" :
                            log.action.includes("REJECTED") ? "secondary" :
                            "outline"
                          }>
                            {log.action.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.targetType && (
                            <span className="text-sm font-medium">{log.targetType}</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-md truncate">{log.description}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Showing {logs.length} of {pagination.total} results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLogs(Math.max(1, pagination.page - 1), actionFilter)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-2 text-sm">{pagination.page} / {pagination.totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchLogs(Math.min(pagination.totalPages, pagination.page + 1), actionFilter)}
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
    </div>
  );
}
