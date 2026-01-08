"use client";

import { 
  ArrowRight, 
  TrendingUp, 
  Activity, 
  LucideIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";

export interface StatItem {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  description?: string;
  color?: "emerald" | "orange" | "blue" | "rose" | "amber" | "purple" | "indigo" | "cyan" | "zinc";
  loading?: boolean;
}

interface StatsRailProps {
  stats: StatItem[];
  loading?: boolean;
  className?: string;
  gridClassName?: string;
}

const colorStyles = {
  emerald: {
    text: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "group-hover:border-emerald-500/50",
    gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    iconBg: "bg-emerald-500/10",
    progress: "bg-emerald-500",
    badge: "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
  },
  orange: {
    text: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "group-hover:border-orange-500/50",
    gradient: "from-orange-500/10 via-orange-500/5 to-transparent",
    iconBg: "bg-orange-500/10",
    progress: "bg-orange-500",
    badge: "text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/30",
  },
  blue: {
    text: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "group-hover:border-blue-500/50",
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    iconBg: "bg-blue-500/10",
    progress: "bg-blue-500",
    badge: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30",
  },
  rose: {
    text: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "group-hover:border-rose-500/50",
    gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
    iconBg: "bg-rose-500/10",
    progress: "bg-rose-500",
    badge: "text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30",
  },
  amber: {
    text: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "group-hover:border-amber-500/50",
    gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    iconBg: "bg-amber-500/10",
    progress: "bg-amber-500",
    badge: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
  },
  purple: {
    text: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "group-hover:border-purple-500/50",
    gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
    iconBg: "bg-purple-500/10",
    progress: "bg-purple-500",
    badge: "text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/30",
  },
  indigo: {
    text: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "group-hover:border-indigo-500/50",
    gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent",
    iconBg: "bg-indigo-500/10",
    progress: "bg-indigo-500",
    badge: "text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/30",
  },
  cyan: {
    text: "text-cyan-500",
    bg: "bg-cyan-500/10",
    border: "group-hover:border-cyan-500/50",
    gradient: "from-cyan-500/10 via-cyan-500/5 to-transparent",
    iconBg: "bg-cyan-500/10",
    progress: "bg-cyan-500",
    badge: "text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/30",
  },
  zinc: {
    text: "text-zinc-500 dark:text-zinc-400",
    bg: "bg-zinc-500/10",
    border: "group-hover:border-zinc-500/50",
    gradient: "from-zinc-500/10 via-zinc-500/5 to-transparent",
    iconBg: "bg-zinc-500/10",
    progress: "bg-zinc-500",
    badge: "text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800",
  },
};

export function StatsRail({ stats, loading, className, gridClassName }: StatsRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
      checkScroll();
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [loading, stats]);

  if (loading) {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", gridClassName)}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-3xl bg-zinc-900/5" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("relative group/container", className)}>
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
        className={cn(
          "flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory md:grid md:gap-6 md:pb-0 md:mx-0 md:px-0",
          gridClassName || "md:grid-cols-2 lg:grid-cols-4"
        )}
      >
        {stats.map((stat, index) => {
          const styles = colorStyles[stat.color || "zinc"];
          
          return (
            <motion.div
              key={stat.title + index}
              className="min-w-[280px] md:min-w-0 snap-center flex-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={cn(
                "group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-xl transition-all duration-300",
                "hover:shadow-xl hover:-translate-y-1",
                styles.border
              )}>
                {/* Hover Gradient Background */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-br",
                  styles.gradient
                )} />

                <div className="relative p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                      "p-3 rounded-2xl ring-1 ring-inset shadow-sm transition-colors duration-300",
                      "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-700/50",
                      "group-hover:bg-white dark:group-hover:bg-zinc-800",
                      styles.text
                    )}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    
                    {/* Change Badge */}
                    {stat.change && (
                      <div className={cn(
                        "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border bg-zinc-50 dark:bg-zinc-900/50",
                        stat.changeType === "positive" ? colorStyles.emerald.badge :
                        stat.changeType === "negative" ? colorStyles.rose.badge :
                        styles.badge
                      )}>
                        {stat.changeType === "positive" ? <TrendingUp className="h-3 w-3" /> : 
                         stat.changeType === "negative" ? <Activity className="h-3 w-3" /> : null}
                        {stat.change}
                      </div>
                    )}
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
                      styles.progress
                    )} />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
