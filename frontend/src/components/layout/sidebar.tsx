"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Zap,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

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
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ className, collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const handleSupport = () => {
    toast.info("Support: Contact us at support@jerai.com");
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl border border-zinc-200 dark:border-white/5 rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-300 ring-1 ring-zinc-200 dark:ring-white/5",
        collapsed ? "w-[80px]" : "w-full",
        className
      )}
    >
      {/* Logo Section */}
      <div className={cn("pb-2", collapsed ? "p-4" : "p-6")}>
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-4 group">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25 group-hover:scale-105 group-hover:shadow-orange-500/40 transition-all duration-300 shrink-0">
              <Zap className="h-6 w-6 text-white fill-white" />
              <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
                  JERAI
                </span>
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
                  Fitness Pro
                </span>
              </div>
            )}
          </Link>
          {onToggle && !collapsed && (
            <button
              onClick={onToggle}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
        {onToggle && collapsed && (
          <button
            onClick={onToggle}
            className="mt-3 flex w-full h-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className={cn("py-2", collapsed ? "px-2" : "px-4")}>
        <nav className="space-y-1">
          {mainNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl text-sm font-bold transition-all duration-300",
                  collapsed ? "px-0 py-3 justify-center" : "px-4 py-3",
                  isActive
                    ? "bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white shadow-inner border border-zinc-200 dark:border-white/5"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 hover:translate-x-1"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-orange-500" : "text-current")} />
                {!collapsed && <span>{item.name}</span>}
                {isActive && !collapsed && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Library Section */}
      <div className="flex-1 flex flex-col min-h-0 mt-2">
        {!collapsed && (
          <div className="px-6 py-2 flex items-center justify-between group cursor-pointer">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
              Management
            </span>
            <Library className="h-3 w-3 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
          </div>
        )}

        <div className={cn("flex-1 overflow-y-auto py-2 scrollbar-none hover:scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800", collapsed ? "px-2" : "px-4")}>
          <nav className="space-y-1">
            {libraryItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                    collapsed ? "px-0 py-2.5 justify-center" : "px-4 py-2.5",
                    isActive
                      ? cn("bg-linear-to-r from-orange-500/10 to-transparent text-zinc-900 dark:text-white", !collapsed && "border-l-2 border-orange-500")
                      : cn("text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white", !collapsed && "border-l-2 border-transparent")
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={cn(
                    "h-4 w-4 transition-colors shrink-0",
                    isActive ? "text-orange-500" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                  )} />
                  {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className={cn("mt-auto", collapsed ? "p-2" : "p-4")}>
        <div className="bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl p-1 border border-zinc-200 dark:border-white/5 backdrop-blur-md">
          <button
            onClick={handleSupport}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-all duration-200",
              collapsed ? "px-0 py-3 justify-center" : "px-4 py-3"
            )}
            title={collapsed ? "Support" : undefined}
          >
            <HelpCircle className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Support</span>}
          </button>
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200",
              collapsed ? "px-0 py-3 justify-center" : "px-4 py-3"
            )}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
