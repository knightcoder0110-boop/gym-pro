"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClassSession {
    id: string;
    name: string;
    instructor: string;
    startTime: string;
    endTime: string;
    attendees: number;
    capacity: number;
    category: string;
}

export function UpcomingClasses() {
  const { data, isLoading } = useQuery({
    queryKey: ["upcoming-classes"],
    queryFn: async () => {
       // Mocking for now
      return [
        {
            id: "1",
            name: "HIIT Blast",
            instructor: "Alex T.",
            startTime: new Date(new Date().setHours(17, 0)).toISOString(),
            endTime: new Date(new Date().setHours(18, 0)).toISOString(),
            attendees: 18,
            capacity: 20,
            category: "Cardio"
        },
        {
            id: "2",
            name: "Power Yoga",
            instructor: "Sarah J.",
            startTime: new Date(new Date().setHours(18, 30)).toISOString(),
            endTime: new Date(new Date().setHours(19, 30)).toISOString(),
            attendees: 12,
            capacity: 25,
            category: "Flexibility"
        },
        {
            id: "3",
            name: "Zumba Dance",
            instructor: "Mike R.",
            startTime: new Date(new Date().setHours(19, 0)).toISOString(),
            endTime: new Date(new Date().setHours(20, 0)).toISOString(),
            attendees: 8,
            capacity: 15,
            category: "Dance"
        }
      ] as ClassSession[];
    },
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
        case "Cardio": return "text-orange-600 dark:text-orange-500 bg-orange-100/50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20";
        case "Flexibility": return "text-emerald-600 dark:text-emerald-500 bg-emerald-100/50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";
        case "Dance": return "text-pink-600 dark:text-pink-500 bg-pink-100/50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20";
        default: return "text-blue-600 dark:text-blue-500 bg-blue-100/50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";
    }
  }

  return (
    <Card className="h-full border border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white">Today&apos;s Classes</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">Upcoming sessions</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full px-3">View All</Button>
      </CardHeader>
      <CardContent className="p-4 flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-3">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
            ))
          ) : (
            data?.map((session) => (
              <div
                key={session.id}
                className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-white/5 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-300 cursor-pointer shadow-sm"
              >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`flex flex-col items-center justify-center rounded-xl p-2 min-w-14 border ${getCategoryColor(session.category)}`}>
                            <span className="text-xs font-bold">
                                {format(new Date(session.startTime), "HH:mm")}
                            </span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-orange-500 transition-colors">{session.name}</h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{session.instructor}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-black/20 px-2 py-1 rounded-lg border border-zinc-200 dark:border-white/5">
                        <Users className="h-3 w-3" />
                        <span>{session.attendees}/{session.capacity}</span>
                    </div>
                </div>
                
                {/* Progress bar for capacity */}
                <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full ${session.attendees / session.capacity > 0.8 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${(session.attendees / session.capacity) * 100}%` }}
                    />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
