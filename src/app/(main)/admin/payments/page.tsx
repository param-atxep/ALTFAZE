"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Payment {
  id: string;
  amount: number;
  status: string;
  paymentStatus: string;
  escrowStatus: string;
  client?: { id: string; name: string; email: string };
  project?: { id: string; title: string };
  createdAt: string;
}

interface TemplatePurchase {
  id: string;
  amount: number;
  status: string;
  paymentStatus: string;
  buyer: { id: string; name: string; email: string };
  seller: { id: string; name: string; email: string };
  template: { id: string; title: string };
  createdAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminPayments() {
  const [paymentType, setPaymentType] = useState<"orders" | "templates">("orders");
  const [orders, setOrders] = useState<Payment[]>([]);
  const [templatePurchases, setTemplatePurchases] = useState<TemplatePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, limit: 20, totalPages: 0 });

  const fetchPayments = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20"
      });
      const response = await fetch(`/api/admin/payments?${params}`);
      const data = await response.json();
      setOrders(data.orders);
      setTemplatePurchases(data.templatePurchases);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Failed to load payments");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Payment Monitoring</h1>
        <p className="text-gray-600">View all transactions and payment details</p>
      </div>

      {/* Type Selector */}
      <div className="flex gap-2">
        <Button
          variant={paymentType === "orders" ? "default" : "outline"}
          onClick={() => setPaymentType("orders")}
        >
          Project Orders
        </Button>
        <Button
          variant={paymentType === "templates" ? "default" : "outline"}
          onClick={() => setPaymentType("templates")}
        >
          Template Sales
        </Button>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {paymentType === "orders" ? "Project Orders" : "Template Sales"} ({pagination.total})
          </CardTitle>
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
                      <TableHead>ID</TableHead>
                      {paymentType === "orders" ? (
                        <>
                          <TableHead>Client</TableHead>
                          <TableHead>Project</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>Buyer</TableHead>
                          <TableHead>Seller</TableHead>
                          <TableHead>Template</TableHead>
                        </>
                      )}
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Escrow Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentType === "orders" ? (
                      orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}</TableCell>
                          <TableCell>{order.client?.name || "N/A"}</TableCell>
                          <TableCell>{order.project?.title || "N/A"}</TableCell>
                          <TableCell className="font-bold">${order.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={
                              order.paymentStatus === "SUCCEEDED" ? "default" :
                              order.paymentStatus === "PENDING" ? "secondary" :
                              "destructive"
                            }>
                              {order.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              order.escrowStatus === "HELD" ? "secondary" :
                              order.escrowStatus === "RELEASED" ? "default" :
                              "outline"
                            }>
                              {order.escrowStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      templatePurchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell className="font-mono text-sm">{purchase.id.slice(0, 8)}</TableCell>
                          <TableCell>{purchase.buyer.name}</TableCell>
                          <TableCell>{purchase.seller.name}</TableCell>
                          <TableCell>{purchase.template.title}</TableCell>
                          <TableCell className="font-bold">${purchase.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={
                              purchase.paymentStatus === "SUCCEEDED" ? "default" :
                              purchase.paymentStatus === "PENDING" ? "secondary" :
                              "destructive"
                            }>
                              {purchase.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              purchase.escrowStatus === "HELD" ? "secondary" :
                              purchase.escrowStatus === "RELEASED" ? "default" :
                              "outline"
                            }>
                              {purchase.escrowStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(purchase.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Showing {paymentType === "orders" ? orders.length : templatePurchases.length} results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPayments(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-2 text-sm">{pagination.page} / {pagination.totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPayments(Math.min(pagination.totalPages, pagination.page + 1))}
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
