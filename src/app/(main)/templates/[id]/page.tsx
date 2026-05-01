"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTemplate, buyTemplate } from "@/actions/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeftIcon, CheckIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [alreadyOwned, setAlreadyOwned] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      const result = await getTemplate(templateId);
      if ("error" in result) {
        toast.error(result.error);
        router.push("/templates");
      } else {
        setTemplate(result);
      }
    } catch (error) {
      toast.error("Failed to load template");
      router.push("/templates");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTemplate = async () => {
    setPurchasing(true);
    try {
      const result = await buyTemplate(templateId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Template purchased successfully!");
        setAlreadyOwned(true);
        router.push("/dashboard?tab=templates");
      }
    } catch (error) {
      toast.error("Failed to purchase template");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!template) {
    return <div className="p-8">Template not found</div>;
  }

  return (
    <div className="w-full space-y-8 p-8">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back to Templates
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image */}
          <div
            className="w-full h-96 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600"
            style={{
              backgroundImage: template.imageUrl ? `url(${template.imageUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* Title & Creator */}
          <div>
            <h1 className="text-4xl font-bold">{template.title}</h1>
            <div className="flex items-center gap-2 mt-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
              <div>
                <p className="font-semibold">{template.creator?.name}</p>
                <p className="text-sm text-muted-foreground">{template.creator?.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h2 className="text-2xl font-bold mb-4">About This Template</h2>
            <p className="text-muted-foreground leading-relaxed">{template.description}</p>
          </div>

          {/* Features */}
          {template.features && template.features.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Features</h2>
              <ul className="space-y-3">
                {template.features.map((feature: string) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Category & Tech Stack */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Category</h3>
              <Badge>{template.category}</Badge>
            </div>
            {template.techStack && template.techStack.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {template.techStack.map((tech: string) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Creator Info */}
          <Card>
            <CardHeader>
              <CardTitle>About the Creator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
                <div>
                  <p className="font-semibold">{template.creator?.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">
                      {template.creator?.rating || 0} ({template.creator?.reviewCount || 0} reviews)
                    </span>
                  </div>
                </div>
              </div>
              {template.creator?.profile?.bio && (
                <p className="text-sm text-muted-foreground">{template.creator.profile.bio}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Buy Section */}
        <div className="space-y-6">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Buy Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-4xl font-bold">${template.price}</p>
              </div>

              {/* Stats */}
              <div className="space-y-2 py-4 border-y">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Downloads</span>
                  <span className="font-semibold">{template.downloads || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rating</span>
                  <span className="font-semibold flex items-center gap-1">
                    <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {template.rating || 0}
                  </span>
                </div>
              </div>

              {/* Buy Button */}
              {alreadyOwned ? (
                <Button className="w-full" disabled>
                  Already Owned
                </Button>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleBuyTemplate}
                  disabled={purchasing}
                >
                  {purchasing ? "Processing..." : `Buy for $${template.price}`}
                </Button>
              )}

              {/* Features List */}
              <div className="space-y-2 text-sm">
                <p className="font-semibold">What You Get:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-green-500" />
                    Full source code
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-green-500" />
                    Lifetime license
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-green-500" />
                    Free updates
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="w-4 h-4 text-green-500" />
                    Support access
                  </li>
                </ul>
              </div>

              {/* Back to Browse */}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/templates">Browse More</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
