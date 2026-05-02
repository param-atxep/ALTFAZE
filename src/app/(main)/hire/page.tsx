"use client";

import { useEffect, useState } from "react";
import { getFreelancers } from "@/actions/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { StarIcon, SearchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function BrowseFreelancersPage() {
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState<number>();

  useEffect(() => {
    const loadFreelancers = async () => {
      setLoading(true);
      try {
        const results = await getFreelancers(undefined, minRating);
        const filtered = results.filter((f: any) =>
          search ? f.name.toLowerCase().includes(search.toLowerCase()) ||
                  f.skills?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))
          : true
        );
        setFreelancers(filtered || []);
      } catch (error) {
        toast.error("Failed to load freelancers");
      } finally {
        setLoading(false);
      }
    };

    loadFreelancers();
  }, [minRating, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    
    // Filter locally
    if (freelancers.length > 0) {
      const filtered = freelancers.filter((f: any) =>
        value ? f.name.toLowerCase().includes(value.toLowerCase()) ||
                f.skills?.some((s: string) => s.toLowerCase().includes(value.toLowerCase()))
        : true
      );
      setFreelancers(filtered);
    }
  };

  return (
    <div className="w-full space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Find Freelancers</h1>
        <p className="text-muted-foreground mt-1">
          Browse and hire from our verified freelancer network
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or skill..."
            className="pl-10"
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={minRating === undefined ? "primary" : "outline"}
            onClick={() => setMinRating(undefined)}
          >
            All Ratings
          </Button>
          <Button
            variant={minRating === 4 ? "primary" : "outline"}
            onClick={() => setMinRating(4)}
          >
            4+ Stars
          </Button>
          <Button
            variant={minRating === 5 ? "primary" : "outline"}
            onClick={() => setMinRating(5)}
          >
            5 Stars
          </Button>
        </div>
      </div>

      {/* Freelancers Grid */}
      {loading ? (
        <div className="text-center py-12">Loading freelancers...</div>
      ) : freelancers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No freelancers found matching your criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freelancers.map((freelancer) => (
            <Card key={freelancer.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{freelancer.name}</CardTitle>
                    <p className="text-sm text-muted-foreground font-normal">
                      {freelancer.profile?.title || "Freelancer"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bio */}
                {freelancer.profile?.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {freelancer.profile.bio}
                  </p>
                )}

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
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
                  </div>
                  <span className="text-sm font-semibold">
                    {freelancer.rating || 0} ({freelancer.reviewCount || 0})
                  </span>
                </div>

                {/* Hourly Rate */}
                <div className="py-2 border-y">
                  <p className="text-sm text-muted-foreground">Hourly Rate</p>
                  <p className="text-2xl font-bold">${freelancer.hourlyRate || 0}/hr</p>
                </div>

                {/* Skills */}
                {freelancer.skills && freelancer.skills.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {freelancer.skills.slice(0, 3).map((skill: string) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {freelancer.skills.length > 3 && (
                        <Badge variant="outline">+{freelancer.skills.length - 3}</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button className="w-full" asChild>
                  <Link href={`/hire/${freelancer.id}`}>
                    Send Hire Request
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
