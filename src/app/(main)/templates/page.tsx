"use client";

import { useEffect, useState } from "react";
import { getTemplates } from "@/actions/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { SearchIcon, ShoppingCartIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

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

const PRICE_RANGES = [
  { label: "All Prices", min: undefined, max: undefined },
  { label: "Under $50", min: 0, max: 50 },
  { label: "$50 - $100", min: 50, max: 100 },
  { label: "$100 - $250", min: 100, max: 250 },
  { label: "$250+", min: 250, max: undefined },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedPriceRange, setSelectedPriceRange] = useState<number>(0);

  useEffect(() => {
    loadTemplates();
  }, [search, selectedCategory, selectedPriceRange]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const priceRange = PRICE_RANGES[selectedPriceRange];
      const results = await getTemplates(
        selectedCategory,
        priceRange.min,
        priceRange.max,
        search || undefined
      );
      setTemplates(results || []);
    } catch (error) {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Browse Templates</h1>
        <p className="text-muted-foreground mt-1">
          Discover premium website templates from expert designers
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={selectedCategory || ""} onValueChange={setSelectedCategory}>
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

        <Select
          value={String(selectedPriceRange)}
          onValueChange={(v) => setSelectedPriceRange(Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Prices" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_RANGES.map((range, idx) => (
              <SelectItem key={idx} value={String(idx)}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="text-center py-12">Loading templates...</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No templates found. Try adjusting your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              {template.imageUrl && (
                <div
                  className="w-full h-40 bg-gradient-to-br from-blue-500 to-purple-600"
                  style={{
                    backgroundImage: `url(${template.imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              )}
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{template.title}</CardTitle>
                <p className="text-sm text-muted-foreground font-normal">
                  by {template.creator?.name}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm line-clamp-3">{template.description}</p>

                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {template.category}
                  </span>
                  {template.features?.slice(0, 2).map((feature: string) => (
                    <span key={feature} className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-2xl font-bold">${template.price}</span>
                  <Button asChild>
                    <Link href={`/templates/${template.id}`}>View Details</Link>
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
