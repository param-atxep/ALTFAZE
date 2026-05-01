"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getFreelancerDashboard,
  getFreelancerEarningsStats,
  getFreelancerTemplates,
  getFreelancerSales,
  deleteTemplate,
} from "@/actions/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import {
  DollarSignIcon,
  FileIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
  EditIcon,
  TrashIcon,
} from "lucide-react";
import { toast } from "sonner";

export default function FreelancerDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== "FREELANCER") {
      router.push("/");
      return;
    }
    loadData();
  }, [session, router]);

  const loadData = async () => {
    try {
      const [statsData, templatesData, salesData] = await Promise.all([
        getFreelancerEarningsStats(),
        getFreelancerTemplates(),
        getFreelancerSales(),
      ]);

      setStats(statsData);
      setTemplates(templatesData || []);
      setSales(salesData || []);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteConfirmId) return;

    setDeleting(true);
    try {
      const result = await deleteTemplate(deleteConfirmId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Template deleted successfully!");
        setTemplates((prev) => prev.filter((t) => t.id !== deleteConfirmId));
      }
    } catch (error) {
      toast.error("Failed to delete template");
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
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
          <h1 className="text-3xl font-bold">Freelancer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage templates, track earnings & bids</p>
        </div>
        <Button asChild>
          <Link href="/freelancer/create-template">+ Create Template</Link>
        </Button>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <Button variant="ghost" className="w-full justify-start h-auto p-0" asChild>
              <Link href="/freelancer/earnings" className="flex flex-col items-start gap-2">
                <TrendingUpIcon className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">View Detailed Earnings</span>
                <span className="text-xs text-muted-foreground">Analytics & transactions</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <Button variant="ghost" className="w-full justify-start h-auto p-0" asChild>
              <Link href="/freelancer/my-bids" className="flex flex-col items-start gap-2">
                <FileIcon className="w-5 h-5 text-purple-600" />
                <span className="font-semibold">My Bids</span>
                <span className="text-xs text-muted-foreground">Track your proposals</span>
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <Button variant="ghost" className="w-full justify-start h-auto p-0" asChild>
              <Link href="/projects" className="flex flex-col items-start gap-2">
                <ShoppingBagIcon className="w-5 h-5 text-green-600" />
                <span className="font-semibold">Browse Projects</span>
                <span className="text-xs text-muted-foreground">Find new opportunities</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSignIcon className="w-4 h-4" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalEarnings?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBagIcon className="w-4 h-4" />
              Templates Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSales || 0}</div>
            <p className="text-xs text-muted-foreground">All templates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUpIcon className="w-4 h-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.thisMonth?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Monthly earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileIcon className="w-4 h-4" />
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">Created</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">My Templates</TabsTrigger>
          <TabsTrigger value="sales">Sales Orders</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No templates yet. Create your first template!</p>
                <Button asChild className="mt-4">
                  <Link href="/freelancer/create-template">Create Template</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {templates.map((template: any) => (
                <Card key={template.id}>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{template.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {template.description}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">${template.price}</Badge>
                        <Badge variant="secondary">{template.category}</Badge>
                        <Badge>{template._count?.purchases || 0} sales</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/freelancer/edit-template/${template.id}`}>
                          <EditIcon className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteConfirmId(template.id)}
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-4">
          {sales.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No sales yet. Create templates to start earning!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sales.map((sale: any) => (
                <Card key={sale.id}>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{sale.template?.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Buyer: {sale.buyer?.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">${sale.amount.toFixed(2)}</p>
                      <Badge className="mt-2">{sale.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
