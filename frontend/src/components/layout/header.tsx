"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Menu, ChevronLeft, ChevronRight, Settings, Plus, UserPlus, CreditCard, CalendarPlus, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";
import Link from "next/link";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const handleBack = () => {
    router.back();
  };

  const handleForward = () => {
    router.forward();
  };

  return (
    <header className="flex items-center justify-between gap-2 sm:gap-4 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl sm:rounded-[2rem] px-3 sm:px-6 py-2 sm:py-3 shadow-lg w-full min-w-0">
      {/* Left side - Navigation and Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        {/* Mobile menu button */}
        <button
          className="lg:hidden flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors border border-zinc-200 dark:border-white/5"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Navigation arrows */}
        <div className="hidden md:flex items-center gap-2">
          <button 
            onClick={handleBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-all border border-zinc-200 dark:border-white/5 disabled:opacity-50"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button 
            onClick={handleForward}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 transition-all border border-zinc-200 dark:border-white/5 disabled:opacity-50"
            aria-label="Go forward"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative group max-w-md w-full hidden sm:block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
          <input
            type="search"
            placeholder="Search for anything..."
            className="h-11 w-full rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/50 pl-11 pr-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white dark:focus:bg-zinc-900 focus:border-orange-500/20 border border-zinc-200 dark:border-white/5 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 px-1.5 font-mono text-[10px] font-medium text-zinc-500">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Quick Action */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="hidden md:flex bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/20 border border-orange-400/20">
              <Plus className="h-4 w-4 mr-2" />
              Quick Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white/90 dark:bg-zinc-900/90 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-2xl rounded-xl p-1 shadow-2xl">
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-white/5">
              <Link href="/members/new">
                <UserPlus className="mr-2 h-4 w-4 text-orange-500" />
                New Member
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-white/5">
              <Link href="/payments">
                <CreditCard className="mr-2 h-4 w-4 text-emerald-500" />
                Record Payment
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-white/5">
              <Link href="/classes">
                <CalendarPlus className="mr-2 h-4 w-4 text-blue-500" />
                Book Class
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-white/5">
              <Link href="/leads">
                <UserPlus className="mr-2 h-4 w-4 text-purple-500" />
                Add Lead
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-8 w-px bg-zinc-200 dark:bg-white/5 mx-2 hidden md:block" />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10 hover:scale-105 transition-all border border-zinc-200 dark:border-white/5"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-white/90 dark:bg-zinc-900/90 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-2xl rounded-2xl p-2 shadow-2xl">
            <DropdownMenuLabel className="text-zinc-500 dark:text-zinc-400 px-3 text-xs uppercase tracking-wider font-bold">Notifications</DropdownMenuLabel>
            <div className="mt-2 space-y-1">
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5 focus:bg-zinc-100 dark:focus:bg-white/5 cursor-pointer rounded-xl group">
                <div className="flex items-center justify-between w-full">
                  <p className="text-sm font-semibold group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">New member registered</p>
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  John Doe just joined the gym
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">2 minutes ago</p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5 focus:bg-zinc-100 dark:focus:bg-white/5 cursor-pointer rounded-xl">
                <p className="text-sm font-semibold">Payment received</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  ₹5,000 payment from Jane Smith
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">15 minutes ago</p>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex h-9 sm:h-11 items-center gap-2 sm:gap-3 rounded-xl bg-zinc-100 dark:bg-white/5 p-1.5 sm:pl-2 sm:pr-4 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all group border border-zinc-200 dark:border-white/5"
              aria-label="User menu"
            >
              <Avatar className="h-6 w-6 sm:h-8 sm:w-8 ring-2 ring-white dark:ring-white/10 group-hover:ring-orange-500/50 transition-all">
                <AvatarImage src="/avatars/admin.png" alt="Admin" />
                <AvatarFallback className="bg-linear-to-br from-orange-500 to-amber-600 text-white text-xs font-bold">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Admin</span>
                <span className="text-[10px] text-zinc-500 font-medium">Pro Plan</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 bg-white/90 dark:bg-zinc-900/90 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white backdrop-blur-2xl rounded-2xl p-2 shadow-2xl">
            <DropdownMenuLabel className="px-3 py-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Admin User</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  admin@jerai.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-200 dark:bg-white/5 mx-2" />
            <div className="space-y-1 mt-1">
              <DropdownMenuItem asChild className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 focus:bg-zinc-100 dark:focus:bg-white/5 cursor-pointer rounded-lg px-3 py-2">
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 focus:bg-red-50 dark:focus:bg-red-500/10 cursor-pointer rounded-lg px-3 py-2"
              >
                Log out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
