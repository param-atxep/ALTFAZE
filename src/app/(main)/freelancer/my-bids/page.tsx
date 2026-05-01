"use client";

import { useEffect, useState } from "react";
import { getMyBids } from "@/actions/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DollarSignIcon, CalendarIcon } from "lucide-react";
import { toast } from "sonner";

export default function MyBidsPage() {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBids();
  }, []);

  const loadBids = async () => {
    try {
      const results = await getMyBids();
      setBids(results || []);
    } catch (error) {
      toast.error("Failed to load bids");
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
      <div>
        <h1 className="text-3xl font-bold">My Bids</h1>
        <p className="text-muted-foreground mt-1">Track your project proposals</p>
      </div>

      {/* Bids List */}
      {bids.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No bids yet. Browse projects to get started!</p>
            <Button asChild className="mt-4">
              <Link href="/projects">Browse Projects</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bids.map((bid: any) => (
            <Card key={bid.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Project Title */}
                  <div>
                    <h3 className="text-xl font-bold">{bid.project?.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      by {bid.project?.creator?.name}
                    </p>
                  </div>

                  {/* Project Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {bid.project?.description}
                  </p>

                  {/* Bid Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 bg-muted rounded-lg p-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Your Bid</p>
                      <p className="text-lg font-bold">${bid.bidAmount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Project Budget</p>
                      <p className="text-lg font-bold">${bid.project?.budget}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Delivery</p>
                      <p className="text-lg font-bold">{bid.deliveryDays} days</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Submitted</p>
                      <p className="text-lg font-bold">
                        {new Date(bid.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Your Proposal</p>
                    <p className="text-sm bg-muted p-3 rounded line-clamp-3">
                      {bid.coverLetter}
                    </p>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Skills Required</p>
                    <div className="flex flex-wrap gap-2">
                      {bid.project?.skills?.slice(0, 5).map((skill: string) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {bid.project?.skills?.length > 5 && (
                        <Badge variant="outline">+{bid.project.skills.length - 5}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/projects/${bid.project?.id}`}>View Project</Link>
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link href={`/projects/${bid.project?.id}`}>Edit Bid</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
