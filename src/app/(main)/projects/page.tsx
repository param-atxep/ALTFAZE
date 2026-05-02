"use client";

import { useEffect, useState } from "react";
import { getAvailableProjects } from "@/actions/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { SearchIcon, BriefcaseIcon, DollarSignIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildProjectPath } from "@/lib/seo";

const CATEGORIES = [
  "Web Design",
  "Web Development",
  "Mobile App",
  "UI/UX Design",
  "Graphic Design",
  "Content Writing",
  "SEO",
  "Marketing",
];

export default function BrowseProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>();
  const [budgetRange, setBudgetRange] = useState("all");

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        let minBudget, maxBudget;
        
        if (budgetRange === "0-100") {
          minBudget = 0;
          maxBudget = 100;
        } else if (budgetRange === "100-500") {
          minBudget = 100;
          maxBudget = 500;
        } else if (budgetRange === "500-1000") {
          minBudget = 500;
          maxBudget = 1000;
        } else if (budgetRange === "1000+") {
          minBudget = 1000;
        }

        const results = await getAvailableProjects(category, minBudget, maxBudget);
        
        const filtered = results.filter((p: any) =>
          search ? p.title.toLowerCase().includes(search.toLowerCase()) ||
                  p.description.toLowerCase().includes(search.toLowerCase())
          : true
        );
        
        setProjects(filtered || []);
      } catch (error) {
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [category, budgetRange, search]);

  return (
    <div className="w-full space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Browse Projects</h1>
        <p className="text-muted-foreground mt-1">Find projects to bid on and earn money</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={category || ""} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={budgetRange} onValueChange={setBudgetRange}>
          <SelectTrigger>
            <SelectValue placeholder="Budget Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Budgets</SelectItem>
            <SelectItem value="0-100">$0 - $100</SelectItem>
            <SelectItem value="100-500">$100 - $500</SelectItem>
            <SelectItem value="500-1000">$500 - $1000</SelectItem>
            <SelectItem value="1000+">$1000+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="text-center py-12">Loading projects...</div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No projects found. Try adjusting your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {projects.map((project: any) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {project.skills?.slice(0, 3).map((skill: string) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {project.skills?.length > 3 && (
                        <Badge variant="outline">+{project.skills.length - 3}</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-6 mt-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSignIcon className="w-4 h-4 text-green-600" />
                        <span className="font-semibold">${project.budget}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BriefcaseIcon className="w-4 h-4" />
                        <span>{project._count?.proposals || 0} bids</span>
                      </div>
                    </div>
                  </div>

                  <Button asChild>
                    <Link href={buildProjectPath(project.title, project.id)}>View & Bid</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
