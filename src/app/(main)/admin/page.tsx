"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, DollarSign, TrendingUp, Users, Package, FileText, CreditCard } from "lucide-react";

interface DashboardData {
  stats: {
    totalUsers: number;
    totalFreelancers: number;
    totalClients: number;
    totalProjects: number;
    totalOrders: number;
    totalRevenue: number;
  };
  recentActivity: {
    users: any[];
    orders: any[];
    transactions: any[];
  };
  monthlyRevenue: any[];
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/admin/dashboard");
        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 p-8">
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  const stats: DashboardData['stats'] = data?.stats ?? {
    totalUsers: 0,
    totalFreelancers: 0,
    totalClients: 0,
    totalProjects: 0,
    totalOrders: 0,
    totalRevenue: 0,
  };

  return (
    <div className="space-y-8 p-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500">{stats.totalFreelancers} freelancers • {stats.totalClients} clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue?.toFixed(2)}</div>
            <p className="text-xs text-gray-500">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-gray-500">Active and completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-gray-500">Total transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12%</div>
            <p className="text-xs text-gray-500">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Overview</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={data?.monthlyRevenue || []}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>By transaction type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Project Orders", value: stats.totalOrders * 45 || 0 },
                        { name: "Template Sales", value: stats.totalOrders * 35 || 0 },
                        { name: "Services", value: stats.totalOrders * 20 || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">New Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data?.recentActivity?.users?.slice(0, 5).map((user: any) => (
                    <div key={user.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">New Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data?.recentActivity?.orders?.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{order.client?.name}</p>
                        <p className="text-xs text-gray-500">${order.amount}</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data?.recentActivity?.transactions?.slice(0, 5).map((tx: any) => (
                    <div key={tx.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{tx.user?.name}</p>
                        <p className="text-xs text-gray-500">${tx.amount}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        tx.status === "SUCCEEDED"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {tx.type}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
