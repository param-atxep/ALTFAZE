"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getFreelancerDashboard } from "@/actions/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CreditCardIcon, ShoppingBagIcon, TrendingUpIcon, FilesIcon } from "lucide-react";
import { toast } from "sonner";

export default function FreelancerDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== "FREELANCER") {
      router.push("/");
      return;
    }
    loadDashboard();
  }, [session, router]);

  const loadDashboard = async () => {
    try {
      const data = await getFreelancerDashboard();
      setDashboard(data);
    } catch (error) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!dashboard || "error" in dashboard) {
    return <div className="p-8">Error loading dashboard</div>;
  }

  return (
    <div className="w-full space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Freelancer Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your templates and projects</p>
        </div>
        <Button asChild>
          <Link href="/freelancer/create-template">Create Template</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboard.wallet?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">Available funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FilesIcon className="w-4 h-4" />
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.templateCount || 0}</div>
            <p className="text-xs text-muted-foreground">Templates created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBagIcon className="w-4 h-4" />
              Template Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalSales || 0}</div>
            <p className="text-xs text-muted-foreground">Templates sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUpIcon className="w-4 h-4" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboard.earnings?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">From all sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">My Templates</TabsTrigger>
          <TabsTrigger value="hires">Hire Requests</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          {dashboard.templates?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No templates yet. Create one to start earning.</p>
                <Button asChild className="mt-4">
                  <Link href="/freelancer/create-template">Create First Template</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboard.templates?.map((template: any) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{template.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                    
                    <div className="flex justify-between items-center py-2 border-y">
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-bold">${template.price}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Sales</p>
                        <p className="font-bold">{template._count?.purchases || 0}</p>
                      </div>
                    </div>

                    <Badge>{template.category}</Badge>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild className="flex-1">
                        <Link href={`/freelancer/edit-template/${template.id}`}>Edit</Link>
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1">
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Hire Requests Tab */}
        <TabsContent value="hires" className="space-y-4">
          {dashboard.hireRequests?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No hire requests yet. Keep your profile updated!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {dashboard.hireRequests?.map((request: any) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{request.client?.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{request.client?.email}</p>
                      </div>
                      <Badge>{request.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{request.message}</p>
                    <div className="flex gap-2">
                      {request.status === "PENDING" && (
                        <>
                          <Button size="sm" className="flex-1">
                            Accept
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            Decline
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-4">
          {dashboard.proposals?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No proposals submitted yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {dashboard.proposals?.map((proposal: any) => (
                <Card key={proposal.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{proposal.project?.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{proposal.project?.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4 py-4 border-y">
                      <div>
                        <p className="text-xs text-muted-foreground">Your Bid</p>
                        <p className="font-bold">${proposal.bidAmount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Project Budget</p>
                        <p className="font-bold">${proposal.project?.budget}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Delivery</p>
                        <p className="font-bold">{proposal.deliveryDays} days</p>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/project/${proposal.project?.id}`}>View Project</Link>
                    </Button>
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
