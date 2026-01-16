"use client";

import { cn } from "@/lib/utils";

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  currency?: boolean;
}

export function ChartTooltip({ active, payload, label, currency = false }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 p-3 shadow-xl backdrop-blur-md min-w-[150px]">
      <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-white/5 pb-1 uppercase tracking-wider">
        {label}
      </p>
      <div className="flex flex-col gap-1.5">
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="h-1.5 w-1.5 rounded-full ring-2 ring-white dark:ring-zinc-900" 
                style={{ backgroundColor: item.color || item.fill }}
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {item.name}
              </span>
            </div>
            <span className="text-sm font-bold font-mono text-zinc-900 dark:text-white">
              {currency && typeof item.value === 'number' 
                ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.value)
                : item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
