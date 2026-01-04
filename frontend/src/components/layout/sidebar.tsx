"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  Dumbbell,
  ClipboardList,
  BarChart3,
  UserPlus,
  Package,
  Settings,
  LogOut,
  Home,
  Search,
  Library,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const mainNavigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Search", href: "/search", icon: Search },
];

const libraryItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/members", icon: Users },
  { name: "Memberships", href: "/memberships", icon: CreditCard },
  { name: "Classes", href: "/classes", icon: Calendar },
  { name: "Trainers", href: "/trainers", icon: Dumbbell },
  { name: "Attendance", href: "/attendance", icon: ClipboardList },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Leads", href: "/leads", icon: UserPlus },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col gap-2 p-2 bg-black",
        className
      )}
    >
      {/* Logo Section */}
      <div className="rounded-lg bg-[#121212] p-4">
        <Link href="/dashboard" className="flex items-center gap-3 group mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1db954] group-hover:scale-105 transition-transform">
            <Dumbbell className="h-5 w-5 text-black" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            JERAI
          </span>
        </Link>

        {/* Main Navigation */}
        <nav className="space-y-1">
          {mainNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 rounded-md px-3 py-3 text-base font-bold transition-all duration-200",
                  isActive
                    ? "text-white"
                    : "text-[#b3b3b3] hover:text-white"
                )}
              >
                <item.icon className={cn("h-6 w-6", isActive && "text-white")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Library Section */}
      <div className="flex-1 rounded-lg bg-[#121212] flex flex-col min-h-0">
        {/* Library Header */}
        <div className="flex items-center gap-3 p-4 text-[#b3b3b3] hover:text-white transition-colors cursor-pointer shrink-0">
          <Library className="h-6 w-6" />
          <span className="text-base font-bold">Your Library</span>
        </div>

        {/* Library Items - Scrollable */}
        <div className="flex-1 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-[#282828] scrollbar-track-transparent">
          <nav className="space-y-0.5 pb-4">
            {libraryItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 transition-all duration-200 group",
                    isActive
                      ? "bg-[#282828] text-white"
                      : "text-[#b3b3b3] hover:bg-[#1a1a1a] hover:text-white"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                    isActive ? "bg-[#1db954]" : "bg-[#282828] group-hover:bg-[#333333]"
                  )}>
                    <item.icon className={cn(
                      "h-5 w-5",
                      isActive ? "text-black" : "text-[#b3b3b3] group-hover:text-white"
                    )} />
                  </div>
                  <span className="text-sm font-medium truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#282828]">
          <button
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a] transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
