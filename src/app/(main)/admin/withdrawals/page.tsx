"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  bankAccountLastFour: string | null;
  reason: string | null;
  adminNotes: string | null;
  user: { id: string; name: string; email: string; stripeAccountId: string | null };
  requestedAt: string;
  processedAt: string | null;
  completedAt: string | null;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [adminNotes, setAdminNotes] = useState("");

  const fetchWithdrawals = async (page: number = 1, status: string = "PENDING") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        status
      });
      const response = await fetch(`/api/admin/withdrawals?${params}`);
      const data = await response.json();
      setWithdrawals(data.withdrawals);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Failed to load withdrawals");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals(1, statusFilter);
  }, [statusFilter]);

  const handleAction = async () => {
    if (!selectedWithdrawal) return;
    try {
      const response = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawalId: selectedWithdrawal.id,
          action: actionType,
          adminNotes
        })
      });
      if (!response.ok) throw new Error("Failed to perform action");
      toast.success(`Withdrawal ${actionType}d successfully`);
      setActionDialogOpen(false);
      fetchWithdrawals(pagination.page, statusFilter);
      setAdminNotes("");
    } catch (error) {
      toast.error("Failed to perform action");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Withdrawal Control</h1>
        <p className="text-gray-600">Manage and approve withdrawal requests</p>
      </div>

      {/* Status Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Withdrawals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests ({pagination.total})</CardTitle>
          <CardDescription>Page {pagination.page} of {pagination.totalPages}</CardDescription>
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
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bank Account</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{withdrawal.user.name}</p>
                            <p className="text-xs text-gray-500">{withdrawal.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">${withdrawal.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            withdrawal.status === "APPROVED" ? "default" :
                            withdrawal.status === "COMPLETED" ? "secondary" :
                            withdrawal.status === "REJECTED" ? "destructive" :
                            "outline"
                          }>
                            {withdrawal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{withdrawal.bankAccountLastFour ? `●●●●${withdrawal.bankAccountLastFour}` : "N/A"}</TableCell>
                        <TableCell>{new Date(withdrawal.requestedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {withdrawal.status === "PENDING" && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
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
                                  setSelectedWithdrawal(withdrawal);
                                  setActionType("reject");
                                  setActionDialogOpen(true);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Showing {withdrawals.length} of {pagination.total} results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchWithdrawals(Math.max(1, pagination.page - 1), statusFilter)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-2 text-sm">{pagination.page} / {pagination.totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchWithdrawals(Math.min(pagination.totalPages, pagination.page + 1), statusFilter)}
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
              {actionType === "approve" ? "Approve Withdrawal" : "Reject Withdrawal"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Amount: ${selectedWithdrawal?.amount.toFixed(2)} from {selectedWithdrawal?.user.name}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="Add admin notes (optional)..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="min-h-24"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={actionType === "reject" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {actionType === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
