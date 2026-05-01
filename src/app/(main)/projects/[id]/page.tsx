"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProjectDetails, bidOnProject } from "@/actions/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, DollarSignIcon, CalendarIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);

  const [bidData, setBidData] = useState({
    bidAmount: "",
    deliveryDays: "7",
    coverLetter: "",
  });

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const result = await getProjectDetails(projectId);
      if ("error" in result) {
        toast.error(result.error);
        router.push("/projects");
      } else {
        setProject(result);
      }
    } catch (error) {
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bidData.bidAmount || !bidData.coverLetter.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setBidding(true);
    try {
      const result = await bidOnProject({
        projectId,
        bidAmount: Number(bidData.bidAmount),
        deliveryDays: Number(bidData.deliveryDays),
        coverLetter: bidData.coverLetter,
      });

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(result.updated ? "Bid updated successfully!" : "Bid submitted successfully!");
        setShowBidForm(false);
        loadProject();
      }
    } catch (error) {
      toast.error("Failed to submit bid");
    } finally {
      setBidding(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!project) {
    return <div className="p-8">Project not found</div>;
  }

  return (
    <div className="w-full space-y-8 p-8">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back to Projects
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Client */}
          <div>
            <h1 className="text-4xl font-bold">{project.title}</h1>
            <div className="flex items-center gap-2 mt-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
              <div>
                <p className="font-semibold">{project.creator?.name}</p>
                <p className="text-sm text-muted-foreground">{project.creator?.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h2 className="text-2xl font-bold mb-4">About This Project</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {project.description}
            </p>
          </div>

          {/* Requirements */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Requirements</h2>
            <div className="flex flex-wrap gap-2">
              {project.skills?.map((skill: string) => (
                <Badge key={skill}>{skill}</Badge>
              ))}
            </div>
          </div>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="text-2xl font-bold">${project.budget}</p>
                </div>
                {project.deadline && (
                  <div>
                    <p className="text-sm text-muted-foreground">Deadline</p>
                    <p className="font-semibold">
                      {new Date(project.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="mt-2">{project.status}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Existing Bids */}
          {project.proposals?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{project.proposals.length} Bids Received</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.proposals.map((proposal: any) => (
                  <div key={proposal.id} className="pb-3 border-b last:border-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{proposal.freelancer?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Bid: ${proposal.bidAmount} • {proposal.deliveryDays} days
                        </p>
                      </div>
                    </div>
                    <p className="text-sm mt-2 line-clamp-2">{proposal.coverLetter}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Bidding Section */}
        <div className="space-y-6">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Submit Your Bid</CardTitle>
            </CardHeader>
            <CardContent>
              {showBidForm ? (
                <form onSubmit={handleSubmitBid} className="space-y-4">
                  {/* Bid Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="bidAmount">Your Bid Amount *</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        id="bidAmount"
                        type="number"
                        placeholder="Enter your bid"
                        value={bidData.bidAmount}
                        onChange={(e) =>
                          setBidData((prev) => ({
                            ...prev,
                            bidAmount: e.target.value,
                          }))
                        }
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Delivery Days */}
                  <div className="space-y-2">
                    <Label htmlFor="deliveryDays">Delivery Time (Days) *</Label>
                    <Input
                      id="deliveryDays"
                      type="number"
                      value={bidData.deliveryDays}
                      onChange={(e) =>
                        setBidData((prev) => ({
                          ...prev,
                          deliveryDays: e.target.value,
                        }))
                      }
                      min="1"
                    />
                  </div>

                  {/* Cover Letter */}
                  <div className="space-y-2">
                    <Label htmlFor="coverLetter">Proposal Message *</Label>
                    <Textarea
                      id="coverLetter"
                      placeholder="Tell the client why you're a great fit for this project..."
                      value={bidData.coverLetter}
                      onChange={(e) =>
                        setBidData((prev) => ({
                          ...prev,
                          coverLetter: e.target.value,
                        }))
                      }
                      rows={5}
                      className="resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowBidForm(false)}
                      disabled={bidding}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={bidding}
                      className="flex-1"
                    >
                      {bidding ? "Submitting..." : "Submit Bid"}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  {/* Project Stats */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Budget</span>
                      <span className="font-bold">${project.budget}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Bids</span>
                      <span className="font-bold">{project._count?.proposals || 0}</span>
                    </div>
                    {project.deadline && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Deadline</span>
                        <span className="font-bold">
                          {new Date(project.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <Button
                    onClick={() => setShowBidForm(true)}
                    className="w-full mt-4"
                    size="lg"
                  >
                    Submit a Bid
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Requirements Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skills Needed</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {project.skills?.map((skill: string) => (
                  <li key={skill} className="text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    {skill}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
