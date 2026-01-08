"use client";

import { Button } from "@/components/ui/button";
import { Plus, Search, Bell, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export function DashboardHeader() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8"
    >
      <div className="space-y-1.5">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {getGreeting()}, <span className="bg-linear-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">Admin</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg">
          Here&apos;s what&apos;s happening at your gym today.
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative hidden md:block group">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
          <Input
            type="search"
            placeholder="Search members..."
            className="w-[200px] lg:w-[320px] pl-10 h-10 bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:bg-white dark:focus:bg-zinc-900 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all rounded-full"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="rounded-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10">
            <Bell className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" className="rounded-full text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="h-8 w-px bg-zinc-200 dark:bg-white/10 mx-2" />

        <Button className="h-10 rounded-full bg-linear-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white gap-2 shadow-lg shadow-orange-500/20 border-0 transition-all hover:scale-105">
          <Plus className="h-4 w-4" />
          <span className="font-semibold">New Member</span>
        </Button>
      </div>
    </motion.div>
  );
}
