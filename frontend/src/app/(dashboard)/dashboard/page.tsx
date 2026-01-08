"use client";

import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/v4/header";
import { KpiStats } from "@/components/dashboard/v4/kpi-stats";
import { MainChart } from "@/components/dashboard/v4/main-chart";
import { RecentActivityFeed } from "@/components/dashboard/v4/activity-feed";
import { UpcomingClasses } from "@/components/dashboard/v4/upcoming-classes";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { UserPlus, CreditCard, CalendarPlus, FileText } from "lucide-react";

export default function DashboardPage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-10">
      <DashboardHeader />
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]"
      >
        {/* KPI Stats - Spanning top row */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <KpiStats />
        </div>

        {/* Main Chart - Large prominent block */}
        <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2 h-[500px]">
          <MainChart />
        </motion.div>

        {/* Quick Actions - New Widget */}
        <motion.div variants={item} className="col-span-1 row-span-1">
          <div className="h-full bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-3xl p-6 flex flex-col justify-between shadow-lg hover:shadow-orange-500/10 transition-shadow">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Quick Actions</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Common tasks</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button asChild variant="outline" className="h-20 flex-col gap-2 border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-zinc-700 dark:text-zinc-200 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all group shadow-sm">
                <Link href="/members/new">
                  <UserPlus className="h-6 w-6 text-orange-500 group-hover:text-white transition-colors" />
                  <span className="text-xs">Add Member</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2 border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-zinc-700 dark:text-zinc-200 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition-all group shadow-sm">
                <Link href="/payments">
                  <CreditCard className="h-6 w-6 text-emerald-500 group-hover:text-white transition-colors" />
                  <span className="text-xs">Payment</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2 border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-zinc-700 dark:text-zinc-200 hover:bg-blue-500 hover:border-blue-500 hover:text-white transition-all group shadow-sm">
                <Link href="/classes">
                  <CalendarPlus className="h-6 w-6 text-blue-500 group-hover:text-white transition-colors" />
                  <span className="text-xs">Book Class</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col gap-2 border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-zinc-700 dark:text-zinc-200 hover:bg-purple-500 hover:border-purple-500 hover:text-white transition-all group shadow-sm">
                <Link href="/reports">
                  <FileText className="h-6 w-6 text-purple-500 group-hover:text-white transition-colors" />
                  <span className="text-xs">Report</span>
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Upcoming Classes */}
        <motion.div variants={item} className="col-span-1 row-span-1">
          <UpcomingClasses />
        </motion.div>

        {/* Activity Feed - Wide bottom block */}
        <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1 h-[400px]">
          <RecentActivityFeed />
        </motion.div>

        {/* Placeholder for future widget (e.g., Top Trainers or Goals) */}
        <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1 h-[400px]">
          <div className="h-full bg-linear-to-br from-zinc-100/80 to-zinc-50/50 dark:from-zinc-900/40 dark:to-zinc-900/20 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden group shadow-lg">
            <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 relative z-10">Monthly Goals</h3>
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Revenue Goal</span>
                  <span className="text-zinc-900 dark:text-white font-mono">85%</span>
                </div>
                <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 w-[85%] rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">New Members</span>
                  <span className="text-zinc-900 dark:text-white font-mono">62%</span>
                </div>
                <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[62%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 mt-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-300 italic">
                  &quot;You&apos;re on track to beat last month&apos;s revenue record by 15%!&quot;
                </p>
              </div>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
