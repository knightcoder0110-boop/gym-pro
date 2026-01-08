"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  UserPlus, 
  CreditCard, 
  Dumbbell, 
  Activity as ActivityIcon,
  CalendarCheck,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Activity {
  id: string;
  type: string;
  description: string;
  time: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

export function RecentActivityFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      // Mocking data for now
      return [
        {
          id: "1",
          type: "new_member",
          description: "Rahul Kumar joined the gym",
          time: new Date().toISOString(),
          user: { name: "Rahul Kumar", avatar: "" }
        },
        {
          id: "2",
          type: "payment",
          description: "Payment of ₹2,500 received from Sarah",
          time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          user: { name: "Sarah Wilson", avatar: "" }
        },
        {
          id: "3",
          type: "check_in",
          description: "Mike Tyson checked in",
          time: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          user: { name: "Mike Tyson", avatar: "" }
        },
        {
          id: "4",
          type: "class_booking",
          description: "Emma booked 'Morning Yoga'",
          time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          user: { name: "Emma Watson", avatar: "" }
        },
        {
          id: "5",
          type: "check_in",
          description: "John Doe checked in",
          time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
          user: { name: "John Doe", avatar: "" }
        },
      ] as Activity[];
    },
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "new_member": return <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />;
      case "payment": return <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-500" />;
      case "check_in": return <Dumbbell className="h-4 w-4 text-blue-600 dark:text-blue-500" />;
      case "class_booking": return <CalendarCheck className="h-4 w-4 text-purple-600 dark:text-purple-500" />;
      default: return <ActivityIcon className="h-4 w-4 text-zinc-500" />;
    }
  };

  const getActivityColor = (type: string) => {
      switch (type) {
      case "new_member": return "bg-emerald-100/50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";
      case "payment": return "bg-orange-100/50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20";
      case "check_in": return "bg-blue-100/50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";
      case "class_booking": return "bg-purple-100/50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20";
      default: return "bg-zinc-100/50 dark:bg-zinc-500/10 border-zinc-200 dark:border-zinc-500/20";
    }
  }

  return (
    <Card className="h-full border border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold text-zinc-900 dark:text-white">Live Feed</CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">Latest gym activities</CardDescription>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full">
            <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                  <Skeleton className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px] bg-zinc-200 dark:bg-zinc-800" />
                    <Skeleton className="h-3 w-[150px] bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                </div>
              ))
            ) : (
              data?.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-2xl hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors group cursor-default"
                >
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${getActivityColor(activity.type)} transition-transform group-hover:scale-110 shadow-sm`}>
                    {getActivityIcon(activity.type === "check_in" ? "check_in" : activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors truncate">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                       <p className="text-xs text-zinc-500 font-mono">
                        {format(new Date(activity.time), "h:mm a")}
                       </p>
                       <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/5 font-bold uppercase tracking-wider">
                           {activity.type.replace('_', ' ')}
                       </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
