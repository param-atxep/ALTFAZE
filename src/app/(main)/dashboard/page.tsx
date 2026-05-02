"use client";

import { useEffect, useState } from "react";
import { getClientDashboard, getUserProjects, getUserPurchases, getUserTransactions } from "@/actions/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreditCardIcon, FolderOpenIcon, ShoppingBagIcon, TrendingUpIcon } from "lucide-react";
import { toast } from "sonner";

export default function ClientDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashData, projData, purchData, transData] = await Promise.all([
        getClientDashboard(),
        getUserProjects(),
        getUserPurchases(),
        getUserTransactions(),
      ]);

      setDashboard(dashData);
      setProjects(Array.isArray(projData) ? projData : []);
      setPurchases(Array.isArray(purchData) ? purchData : []);
      setTransactions(Array.isArray(transData) ? transData : []);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="w-full space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your projects and purchases</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/post-project">Post Project</Link>
          </Button>
          <Button asChild>
            <Link href="/templates">Browse Templates</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboard?.wallet?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Available funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FolderOpenIcon className="w-4 h-4" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects?.filter((p: any) => p.status === "OPEN").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Open projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBagIcon className="w-4 h-4" />
              Purchased Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Templates owned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUpIcon className="w-4 h-4" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${transactions?.filter((t: any) => t.type === "PURCHASE").reduce((acc: number, t: any) => acc + t.amount, 0).toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">On purchases</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projects" className="w-full">
        <TabsList>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="templates">Purchased Templates</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          {projects?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No projects yet. Create one to get started.</p>
                <Button asChild className="mt-4">
                  <Link href="/post-project">Post First Project</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {projects.map((project: any) => (
                <Card key={project.id}>
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg">{project.title}</h3>
                        <p className="text-sm text-muted-foreground font-normal">Budget: ${project.budget}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        project.status === "OPEN" ? "bg-green-500/20 text-green-500" : "bg-blue-500/20 text-blue-500"
                      }`}>
                        {project.status}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-2">{project.description}</p>
                    <div className="flex gap-2 mt-4">
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {project._count?.proposals || 0} proposals
                      </span>
                      {project.skills?.map((skill: string) => (
                        <span key={skill} className="text-xs bg-muted px-2 py-1 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          {purchases?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No templates purchased yet.</p>
                <Button asChild className="mt-4">
                  <Link href="/templates">Browse Templates</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchases.map((purchase: any) => (
                <Card key={purchase.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{purchase.template?.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{purchase.template?.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm font-semibold">${purchase.amount}</span>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={purchase.template?.fileUrl || "#"} target="_blank">Download</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          {transactions?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No transactions yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction: any) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`font-bold ${
                      transaction.type === "PURCHASE" ? "text-red-500" : "text-green-500"
                    }`}>
                      {transaction.type === "PURCHASE" ? "-" : "+"} ${transaction.amount.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
