"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTemplate } from "@/actions/marketplace";
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
import { X } from "lucide-react";

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

export default function CreateTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
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
      toast.error("Template title is required");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Template description is required");
      return;
    }
    if (!formData.price) {
      toast.error("Price is required");
      return;
    }
    if (!formData.category) {
      toast.error("Category is required");
      return;
    }

    setLoading(true);
    try {
      const result = await createTemplate({
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
        toast.success("Template created successfully!");
        router.push("/freelancer/dashboard");
      }
    } catch (error) {
      toast.error("Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  const filteredTech = TECH_OPTIONS.filter(
    (tech) =>
      !selectedTech.includes(tech) &&
      tech.toLowerCase().includes(techInput.toLowerCase())
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Create Template</h1>
        <p className="text-muted-foreground mt-2">
          List a new template and start earning
        </p>
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
              <Label htmlFor="title">Template Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Modern SaaS Landing Page"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your template, features, and what's included..."
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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
                    placeholder="99"
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
                placeholder="https://example.com/image.jpg"
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
                placeholder="https://example.com/template.zip"
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

            <div className="space-y-2">
              <p className="text-sm font-semibold">Popular Tech:</p>
              <div className="flex flex-wrap gap-2">
                {TECH_OPTIONS.slice(0, 6).map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => addTech(tech)}
                    disabled={selectedTech.includes(tech)}
                    className="text-sm px-3 py-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-50 transition-colors"
                  >
                    + {tech}
                  </button>
                ))}
              </div>
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
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.title || !formData.description || !formData.price}
            className="flex-1"
          >
            {loading ? "Creating..." : "Create Template"}
          </Button>
        </div>
      </form>
    </div>
  );
}
