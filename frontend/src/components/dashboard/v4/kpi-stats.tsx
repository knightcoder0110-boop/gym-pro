"use client";

import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  IndianRupee, 
  TrendingUp,
  Activity,
  Dumbbell,
  Clock,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  todayCheckIns: number;
  expiringThisWeek: number;
  todayRevenue: number;
  newMembersThisMonth: number;
}

export function KpiStats() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await dashboardApi.getStats();
      return response.data.data as DashboardStats;
    },
  });

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      // Initial check
      checkScroll();
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [isLoading]);

  const stats = [
    {
      title: "Total Members",
      value: data?.totalMembers?.toLocaleString() || "0",
      change: `+${data?.newMembersThisMonth || 0} this month`,
      changeType: "positive" as const,
      icon: Users,
      description: "Active members",
      subValue: data?.activeMembers?.toLocaleString() || "0",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "group-hover:border-emerald-500/50",
      gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
      iconBg: "bg-emerald-500/10",
      progressColor: "bg-emerald-500"
    },
    {
      title: "Today's Revenue",
      value: `₹${(data?.todayRevenue || 0).toLocaleString()}`,
      change: "+12% vs yesterday",
      changeType: "positive" as const,
      icon: IndianRupee,
      description: "Daily earnings",
      subValue: "45 transactions",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "group-hover:border-orange-500/50",
      gradient: "from-orange-500/10 via-orange-500/5 to-transparent",
      iconBg: "bg-orange-500/10",
      progressColor: "bg-orange-500"
    },
    {
      title: "Today's Check-ins",
      value: data?.todayCheckIns?.toString() || "0",
      change: "Peak time: 6PM",
      changeType: "neutral" as const,
      icon: Dumbbell,
      description: "Gym visits",
      subValue: "Live now: 12",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "group-hover:border-amber-500/50",
      gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
      iconBg: "bg-amber-500/10",
      progressColor: "bg-amber-500"
    },
    {
      title: "Expiring Soon",
      value: data?.expiringThisWeek?.toString() || "0",
      change: "Next 7 days",
      changeType: (data?.expiringThisWeek || 0) > 0 ? "negative" as const : "positive" as const,
      icon: Clock,
      description: "Needs attention",
      subValue: "Renewals pending",
      color: "text-zinc-500 dark:text-zinc-400",
      bg: "bg-zinc-500/10",
      border: "group-hover:border-zinc-500/50",
      gradient: "from-zinc-500/10 via-zinc-500/5 to-transparent",
      iconBg: "bg-zinc-500/10",
      progressColor: "bg-zinc-500"
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-3xl bg-zinc-900/5" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
        Failed to load stats
      </div>
    );
  }

  return (
    <div className="relative group/container">
      {/* Scroll Gradient Indicators for Mobile */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 md:hidden",
        canScrollLeft ? "opacity-100" : "opacity-0"
      )} />
      <div className={cn(
        "absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-300 md:hidden",
        canScrollRight ? "opacity-100" : "opacity-0"
      )} />

      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 md:pb-0 md:mx-0 md:px-0"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            className="min-w-[280px] md:min-w-0 snap-center flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={cn(
              "group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-xl transition-all duration-300",
              "hover:shadow-xl hover:-translate-y-1",
              stat.border
            )}>
              {/* Hover Gradient Background */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-br",
                stat.gradient
              )} />

              <div className="relative p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className={cn(
                    "p-3 rounded-2xl ring-1 ring-inset shadow-sm transition-colors duration-300",
                    "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-700/50",
                    "group-hover:bg-white dark:group-hover:bg-zinc-800",
                    stat.color
                  )}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  
                  {/* Badge */}
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border bg-zinc-50 dark:bg-zinc-900/50",
                    stat.changeType === "positive" ? "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30" : 
                    stat.changeType === "negative" ? "text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30" : 
                    "text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                  )}>
                    {stat.changeType === "positive" ? <TrendingUp className="h-3 w-3" /> : 
                     stat.changeType === "negative" ? <Activity className="h-3 w-3" /> : null}
                    {stat.change}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {stat.value}
                  </h3>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                    {stat.title}
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </p>
                </div>

                {/* Progress bar decoration */}
                <div className="mt-4 h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className={cn(
                    "h-full rounded-full w-[70%] transition-all duration-1000 ease-out -translate-x-full group-hover:translate-x-0",
                    stat.progressColor
                  )} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
