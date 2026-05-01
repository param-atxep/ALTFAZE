"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postProject } from "@/actions/marketplace";
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
  "Web Development",
  "Mobile App",
  "UI/UX Design",
  "Graphic Design",
  "Content Writing",
  "SEO",
  "Marketing",
  "Other",
];

const AVAILABLE_SKILLS = [
  "React",
  "Node.js",
  "Python",
  "TypeScript",
  "Next.js",
  "Tailwind CSS",
  "MongoDB",
  "PostgreSQL",
  "Docker",
  "AWS",
  "UI Design",
  "UX Research",
  "Figma",
  "Adobe XD",
  "Content Writing",
  "SEO Optimization",
];

export default function PostProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    category: "",
    deadline: "",
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

  const handleAddSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills((prev) => [...prev, skill]);
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  };

  const filteredSkills = AVAILABLE_SKILLS.filter(
    (skill) =>
      !selectedSkills.includes(skill) &&
      skill.toLowerCase().includes(skillInput.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Project title is required");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Project description is required");
      return;
    }
    if (!formData.budget) {
      toast.error("Budget is required");
      return;
    }
    if (!formData.category) {
      toast.error("Category is required");
      return;
    }
    if (selectedSkills.length === 0) {
      toast.error("At least one skill is required");
      return;
    }

    setLoading(true);
    try {
      const result = await postProject({
        title: formData.title,
        description: formData.description,
        budget: Number(formData.budget),
        category: formData.category,
        skills: selectedSkills,
        deadline: formData.deadline || undefined,
      });

      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Project posted successfully!");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Failed to post project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Post a Project</h1>
        <p className="text-muted-foreground mt-2">
          Get connected with talented freelancers
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Build a React Dashboard"
                value={formData.title}
                onChange={handleInputChange}
              />
              <p className="text-xs text-muted-foreground">
                {formData.title.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your project in detail. Include requirements, expectations, and any specific details..."
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/1000 characters
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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

            {/* Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (USD) *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    id="budget"
                    name="budget"
                    type="number"
                    placeholder="500"
                    value={formData.budget}
                    onChange={handleInputChange}
                    min="10"
                  />
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (Optional)</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Required Skills *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Skills */}
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <Badge key={skill} className="pl-3 pr-1 py-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-2 hover:opacity-70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Skill Input */}
            <div className="relative">
              <Input
                placeholder="Search and add skills..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
              />

              {/* Skill Suggestions */}
              {skillInput && filteredSkills.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10">
                  {filteredSkills.slice(0, 5).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        handleAddSkill(skill);
                        setSkillInput("");
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Popular Skills:</p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SKILLS.slice(0, 8).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleAddSkill(skill)}
                    disabled={selectedSkills.includes(skill)}
                    className="text-sm px-3 py-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="font-semibold text-blue-900 mb-2">Tips for posting:</p>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Be specific about what you need</li>
              <li>• Include all relevant details and requirements</li>
              <li>• Set a realistic budget to attract more proposals</li>
              <li>• Choose all relevant skills</li>
            </ul>
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
            disabled={loading || !formData.title || !formData.description}
            className="flex-1"
          >
            {loading ? "Posting..." : "Post Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
