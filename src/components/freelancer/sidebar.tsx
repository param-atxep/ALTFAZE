"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Briefcase,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard/freelancer",
    icon: LayoutDashboard,
  },
  {
    label: "My Templates",
    href: "/dashboard/freelancer#templates",
    icon: FileText,
  },
  {
    label: "My Bids",
    href: "/freelancer/my-bids",
    icon: Briefcase,
  },
  {
    label: "Earnings",
    href: "/freelancer/earnings",
    icon: TrendingUp,
  },
];

export function FreelancerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-muted/50 p-4 space-y-4">
      <div className="px-4 py-2">
        <h2 className="text-lg font-bold">Freelancer</h2>
      </div>

      <nav className="space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href.split("#")[0]);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
