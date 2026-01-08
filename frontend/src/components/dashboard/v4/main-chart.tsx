"use client";

import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

const data = [
  { name: "Mon", revenue: 4000, visitors: 240 },
  { name: "Tue", revenue: 3000, visitors: 139 },
  { name: "Wed", revenue: 2000, visitors: 980 },
  { name: "Thu", revenue: 2780, visitors: 390 },
  { name: "Fri", revenue: 1890, visitors: 480 },
  { name: "Sat", revenue: 2390, visitors: 380 },
  { name: "Sun", revenue: 3490, visitors: 430 },
];

export function MainChart() {
  const [metric, setMetric] = useState("revenue");

  return (
    <Card className="h-full border border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl shadow-xl overflow-hidden rounded-3xl flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/5">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white">Performance</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            {metric === "revenue" ? "Revenue" : "Attendance"} trends over time
          </CardDescription>
        </div>
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="w-[140px] h-9 text-xs font-medium bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-200 rounded-xl focus:ring-orange-500/50">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 rounded-xl">
            <SelectItem value="revenue" className="text-zinc-900 dark:text-zinc-200 focus:bg-orange-500/20 focus:text-orange-500 rounded-lg">Revenue</SelectItem>
            <SelectItem value="visitors" className="text-zinc-900 dark:text-zinc-200 focus:bg-emerald-500/20 focus:text-emerald-500 rounded-lg">Attendance</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="p-0 flex-1 relative">
        {/* Subtle background grid */}
        <div className="absolute inset-0 grid-pattern opacity-5 dark:opacity-10 pointer-events-none" />
        
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-zinc-200 dark:text-zinc-700" opacity={0.2} />
            <XAxis 
              dataKey="name" 
              stroke="currentColor" 
              className="text-zinc-500 dark:text-zinc-400"
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              dy={10}
              tickMargin={10}
            />
            <YAxis
              stroke="currentColor"
              className="text-zinc-500 dark:text-zinc-400"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => metric === "revenue" ? `₹${value}` : `${value}`}
              dx={-10}
              tickMargin={10}
            />
            <Tooltip
              cursor={{ stroke: 'currentColor', strokeWidth: 2, className: "text-zinc-200 dark:text-zinc-700" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-md">
                      <div className="grid gap-1">
                        <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
                          {metric}
                        </span>
                        <span className={`font-bold text-2xl ${metric === "revenue" ? "text-orange-500" : "text-emerald-500"}`}>
                          {metric === "revenue" 
                            ? `₹${payload[0].value?.toLocaleString()}` 
                            : payload[0].value}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={metric === "revenue" ? "#f97316" : "#10b981"}
              strokeWidth={4}
              fillOpacity={1}
              fill={metric === "revenue" ? "url(#colorRevenue)" : "url(#colorVisitors)"}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
