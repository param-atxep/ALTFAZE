"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFreelancer, hireFreelancer } from "@/actions/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, StarIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";

export default function SendHireRequestPage() {
  const params = useParams();
  const router = useRouter();
  const freelancerId = params.id as string;

  const [freelancer, setFreelancer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadFreelancer = async () => {
      try {
        const result = await getFreelancer(freelancerId);
        if ("error" in result) {
          toast.error(result.error);
          router.push("/hire");
        } else {
          setFreelancer(result);
        }
      } catch (error) {
        toast.error("Failed to load freelancer");
        router.push("/hire");
      } finally {
        setLoading(false);
      }
    };

    loadFreelancer();
  }, [freelancerId]);

  const handleSendRequest = async () => {
    if (!message.trim()) {
      toast.error("Please write a message");
      return;
    }

    setSending(true);
    try {
      const result = await hireFreelancer({
        freelancerId,
        message,
      });

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Hire request sent successfully!");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Failed to send hire request");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!freelancer) {
    return <div className="p-8">Freelancer not found</div>;
  }

  return (
    <div className="w-full space-y-8 p-8">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back to Freelancers
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-4xl font-bold">Send Hire Request</h1>
            <p className="text-muted-foreground mt-2">
              Contact {freelancer.name} about your project
            </p>
          </div>

          {/* Freelancer Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>About {freelancer.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
                <div>
                  <p className="font-semibold text-lg">{freelancer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {freelancer.profile?.title || "Freelancer"}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(freelancer.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                    <span className="text-sm">
                      {freelancer.rating || 0} ({freelancer.reviewCount || 0})
                    </span>
                  </div>
                </div>
              </div>

              {freelancer.profile?.bio && (
                <>
                  <Separator />
                  <div>
                    <p className="font-semibold mb-2">About</p>
                    <p className="text-sm text-muted-foreground">{freelancer.profile.bio}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hourly Rate</p>
                  <p className="text-2xl font-bold">${freelancer.hourlyRate || 0}/hr</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">98%</p>
                </div>
              </div>

              {freelancer.skills && freelancer.skills.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="font-semibold mb-3">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {freelancer.skills.map((skill: string) => (
                        <Badge key={skill}>{skill}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Message Form */}
          <Card>
            <CardHeader>
              <CardTitle>Your Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Tell {freelancer.name} about your project requirements, timeline, and expectations..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="resize-none"
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                <p className="font-semibold mb-2">Tips for a successful hire request:</p>
                <ul className="space-y-1 text-blue-800">
                  <li>Be clear about your project scope and requirements</li>
                  <li>Mention your budget and timeline</li>
                  <li>Ask about their availability and experience with similar projects</li>
                  <li>Be professional and courteous</li>
                </ul>
              </div>

              <Button
                onClick={handleSendRequest}
                disabled={sending || !message.trim()}
                className="w-full"
                size="lg"
              >
                {sending ? "Sending..." : "Send Hire Request"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{freelancer.email}</p>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">Specializations</p>
                <ul className="space-y-2">
                  {freelancer.skills?.slice(0, 5).map((skill: string) => (
                    <li key={skill} className="flex items-center gap-2 text-sm">
                      <CheckIcon className="w-4 h-4 text-green-500" />
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Response Time</span>
                  <span className="font-semibold">~2 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profile Views</span>
                  <span className="font-semibold">1.2K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hire Rate</span>
                  <span className="font-semibold">78%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
