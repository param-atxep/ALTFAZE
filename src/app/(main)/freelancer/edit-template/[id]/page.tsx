"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTemplate, updateTemplate } from "@/actions/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { X, ArrowLeftIcon } from "lucide-react";

const CATEGORIES = [
  "Web Design",
  "E-commerce",
  "Blog",
  "Portfolio",
  "Saas",
  "Landing Page",
  "Mobile App",
  "Other",
];

const TECH_OPTIONS = [
  "React",
  "Next.js",
  "Vue",
  "Angular",
  "Tailwind CSS",
  "Bootstrap",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "MongoDB",
  "PostgreSQL",
  "GraphQL",
  "Stripe",
  "AWS",
];

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [featureInput, setFeatureInput] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    fileUrl: "",
  });

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const result = await getTemplate(templateId);
        if ("error" in result) {
          toast.error(result.error);
          router.push("/freelancer/dashboard");
        } else {
          setFormData({
            title: result.title,
            description: result.description,
            price: String(result.price),
            category: result.category,
            imageUrl: result.imageUrl || "",
            fileUrl: result.fileUrl || "",
          });
          setSelectedTech(result.techStack || []);
          setSelectedFeatures(result.features || []);
        }
      } catch (error) {
        toast.error("Failed to load template");
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addTech = (tech: string) => {
    if (!selectedTech.includes(tech)) {
      setSelectedTech((prev) => [...prev, tech]);
    }
  };

  const removeTech = (tech: string) => {
    setSelectedTech((prev) => prev.filter((t) => t !== tech));
  };

  const addFeature = () => {
    if (featureInput.trim() && !selectedFeatures.includes(featureInput)) {
      setSelectedFeatures((prev) => [...prev, featureInput]);
      setFeatureInput("");
    }
  };

  const removeFeature = (feature: string) => {
    setSelectedFeatures((prev) => prev.filter((f) => f !== feature));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const result = await updateTemplate(templateId, {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category,
        features: selectedFeatures,
        techStack: selectedTech,
        imageUrl: formData.imageUrl || undefined,
        fileUrl: formData.fileUrl || undefined,
      });

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Template updated successfully!");
        router.push("/freelancer/dashboard");
      }
    } catch (error) {
      toast.error("Failed to update template");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  const filteredTech = TECH_OPTIONS.filter(
    (tech) =>
      !selectedTech.includes(tech) &&
      tech.toLowerCase().includes(techInput.toLowerCase())
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeftIcon className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold">Edit Template</h1>
          <p className="text-muted-foreground mt-1">Update your template details</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="1"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media */}
        <Card>
          <CardHeader>
            <CardTitle>Media URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Preview Image URL</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileUrl">Template File URL</Label>
              <Input
                id="fileUrl"
                name="fileUrl"
                type="url"
                value={formData.fileUrl}
                onChange={handleInputChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card>
          <CardHeader>
            <CardTitle>Technology Stack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {selectedTech.map((tech) => (
                <Badge key={tech} className="pl-3 pr-1 py-1">
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTech(tech)}
                    className="ml-2 hover:opacity-70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="relative">
              <Input
                placeholder="Search and add technologies..."
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
              />

              {techInput && filteredTech.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10">
                  {filteredTech.slice(0, 5).map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => {
                        addTech(tech);
                        setTechInput("");
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-muted text-sm"
                    >
                      + {tech}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {selectedFeatures.map((feature) => (
                <Badge key={feature} variant="secondary" className="pl-3 pr-1 py-1">
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(feature)}
                    className="ml-2 hover:opacity-70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="e.g., Responsive Design"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFeature();
                  }
                }}
              />
              <Button type="button" onClick={addFeature} variant="outline">
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
