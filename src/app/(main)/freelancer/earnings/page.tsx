"use client";

import { useEffect, useState } from "react";
import { getFreelancerEarningsStats } from "@/actions/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSignIcon, TrendingUpIcon, CalendarIcon } from "lucide-react";
import { toast } from "sonner";

export default function EarningsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const results = await getFreelancerEarningsStats();
      if ("error" in results) {
        toast.error(results.error);
      } else {
        setStats(results);
      }
    } catch (error) {
      toast.error("Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!stats) {
    return <div className="p-8">Failed to load earnings</div>;
  }

  // Mock monthly breakdown (in production, calculate from transactions)
  const monthlyEarnings = [
    { month: "January", amount: 450, sales: 3 },
    { month: "February", amount: 650, sales: 4 },
    { month: "March", amount: 580, sales: 3 },
    { month: "April", amount: 920, sales: 6 },
    { month: "May", amount: 1200, sales: 8 },
    { month: "June", amount: stats.thisMonth, sales: 4 },
  ];

  const maxEarning = Math.max(...monthlyEarnings.map((m) => m.amount));

  return (
    <div className="w-full space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Earnings & Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your income and sales performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalEarnings?.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        {/* Total Sales */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground mt-1">Templates sold</p>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.thisMonth?.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">June earnings</p>
          </CardContent>
        </Card>

        {/* Wallet Balance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.walletBalance?.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Available to withdraw</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Breakdown Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyEarnings.map((item) => (
                <div key={item.month} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.month}</span>
                    <span className="font-semibold">${item.amount}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      style={{
                        width: `${(item.amount / maxEarning) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{item.sales} sales</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="outline">
              Withdraw Earnings
            </Button>
            <Button className="w-full" variant="outline">
              Download Statement
            </Button>
            <Button className="w-full" variant="outline">
              View Tax Summary
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Time</SelectItem>
                <SelectItem value="june">June 2024</SelectItem>
                <SelectItem value="may">May 2024</SelectItem>
                <SelectItem value="april">April 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Sample transactions */}
            {[
              { id: 1, type: "sale", template: "E-commerce React Template", amount: 150, date: "2024-06-15", buyer: "John Client" },
              { id: 2, type: "sale", template: "Landing Page UI Kit", amount: 200, date: "2024-06-10", buyer: "Sarah Designer" },
              { id: 3, type: "withdrawal", description: "Withdrawal to Bank", amount: -500, date: "2024-06-05" },
              { id: 4, type: "sale", template: "Admin Dashboard Template", amount: 300, date: "2024-06-01", buyer: "Tech Startup" },
              { id: 5, type: "sale", template: "E-commerce React Template", amount: 150, date: "2024-05-28", buyer: "Maya Entrepreneur" },
            ].map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                    <DollarSignIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    {transaction.type === "sale" ? (
                      <>
                        <p className="font-semibold text-sm">{transaction.template}</p>
                        <p className="text-xs text-muted-foreground">Sold to {transaction.buyer}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">Payout</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold text-sm ${
                      transaction.type === "sale"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {transaction.type === "sale" ? "+" : ""}${Math.abs(transaction.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
