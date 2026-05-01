"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  CreditCard, 
  Wallet, 
  BarChart3,
  LogOut,
  Menu,
  X,
  History
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const adminMenuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { title: "Users", icon: Users, href: "/admin/users" },
  { title: "Templates", icon: Package, href: "/admin/templates" },
  { title: "Projects", icon: FileText, href: "/admin/projects" },
  { title: "Payments", icon: CreditCard, href: "/admin/payments" },
  { title: "Withdrawals", icon: Wallet, href: "/admin/withdrawals" },
  { title: "Analytics", icon: BarChart3, href: "/admin/analytics" },
  { title: "Audit Logs", icon: History, href: "/admin/logs" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      }`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {isOpen && (
            <span className="text-xl font-bold text-blue-600">ADMIN</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="ml-auto"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isOpen && <span className="text-sm">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-2 border-t border-gray-200">
          <Link
            href="/auth/sign-out"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-700 hover:bg-red-100 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {isOpen && <span className="text-sm">Logout</span>}
          </Link>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="h-16 flex items-center justify-between px-4">
          <span className="text-xl font-bold text-blue-600">ADMIN</span>
          {/* Mobile menu can be implemented with a sheet/drawer */}
        </div>
      </div>
    </>
  );
}
