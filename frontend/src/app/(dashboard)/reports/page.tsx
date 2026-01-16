"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Sector,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart,
} from "recharts";
import { ChartTooltip } from "@/components/dashboard/v4/chart-tooltip";
import {
  TrendingUp, TrendingDown, Users, IndianRupee, Calendar, Clock, Activity,
  RefreshCw, Loader2, UserPlus, UserMinus, CreditCard, Target, BarChart3,
  CalendarDays, Dumbbell, UserCheck, Megaphone, FileDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { format, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { toast } from "sonner";

const COLORS = {
  orange: "#f97316", emerald: "#10b981", amber: "#f59e0b",
  rose: "#f43f5e", sky: "#0ea5e9", violet: "#8b5cf6", zinc: "#71717a",
};
const CHART_COLORS = [COLORS.orange, COLORS.emerald, COLORS.amber, COLORS.sky, COLORS.rose, COLORS.violet];

interface KPICardProps {
  title: string;
  value: string;
  change?: number;
  subtitle?: string;
  icon: any;
  color: keyof typeof COLORS;
  loading?: boolean;
}

function KPICard({ title, value, change, subtitle, icon: Icon, color, loading }: KPICardProps) {
  const colorClasses = {
    orange: "text-orange-500 bg-orange-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    rose: "text-rose-500 bg-rose-500/10",
    sky: "text-sky-500 bg-sky-500/10",
    violet: "text-violet-500 bg-violet-500/10",
    zinc: "text-zinc-500 bg-zinc-500/10",
  };

  return (
    <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5 shadow-lg min-w-[240px] snap-center">
      <CardContent className="p-4">
        {loading ? (
          <div className="flex h-[80px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{title}</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{value}</p>
              {change !== undefined && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${change >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{Math.abs(change).toFixed(1)}% vs prev</span>
                </div>
              )}
              {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{subtitle}</p>}
            </div>
            <div className={`p-2 rounded-xl ${colorClasses[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<"week" | "month" | "quarter" | "year">("month");
  const [activeTab, setActiveTab] = useState("overview");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  const dateParams = useMemo(() => {
    const today = new Date();
    let start: Date, end = today;
    switch (dateRange) {
      case "week": start = startOfWeek(today); end = endOfWeek(today); break;
      case "month": start = startOfMonth(today); end = endOfMonth(today); break;
      case "quarter": start = subMonths(today, 3); break;
      case "year": start = subMonths(today, 12); break;
      default: start = startOfMonth(today);
    }
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [dateRange]);

  const { data: revenueData, isLoading: loadingRevenue, refetch: refetchRevenue } = useQuery({
    queryKey: ["reports", "revenue", dateParams, groupBy],
    queryFn: async () => (await reportsApi.getRevenueOverview({ ...dateParams, groupBy })).data.data,
  });

  const { data: revenueByPlan, isLoading: loadingRevenueByPlan } = useQuery({
    queryKey: ["reports", "revenue-by-plan", dateParams],
    queryFn: async () => (await reportsApi.getRevenueByPlan(dateParams)).data.data,
  });

  const { data: memberData, isLoading: loadingMembers, refetch: refetchMembers } = useQuery({
    queryKey: ["reports", "members", dateParams, groupBy],
    queryFn: async () => (await reportsApi.getMemberAnalytics({ ...dateParams, groupBy })).data.data,
  });

  const { data: retentionData, isLoading: loadingRetention } = useQuery({
    queryKey: ["reports", "retention"],
    queryFn: async () => (await reportsApi.getMemberRetention({ months: 6 })).data.data,
  });

  const { data: attendanceData, isLoading: loadingAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ["reports", "attendance", dateParams, groupBy],
    queryFn: async () => (await reportsApi.getAttendanceAnalytics({ ...dateParams, groupBy })).data.data,
  });

  const { data: classData, isLoading: loadingClasses } = useQuery({
    queryKey: ["reports", "classes", dateParams],
    queryFn: async () => (await reportsApi.getClassAnalytics(dateParams)).data.data,
  });

  const { data: leadsData, isLoading: loadingLeads } = useQuery({
    queryKey: ["reports", "leads", dateParams],
    queryFn: async () => (await reportsApi.getLeadsAnalytics(dateParams)).data.data,
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);

  const handleExport = async (type: "revenue" | "members" | "attendance") => {
    try {
      const response = await reportsApi.exportReport({ type, format: "csv", ...dateParams });
      const blob = new Blob([response.data as BlobPart], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Report exported!");
    } catch { toast.error("Export failed"); }
  };

  const handleRefresh = () => { refetchRevenue(); refetchMembers(); refetchAttendance(); toast.success("Refreshed!"); };
  const isLoading = loadingRevenue || loadingMembers || loadingAttendance;

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl text-zinc-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Comprehensive insights into your gym&apos;s performance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-900/50">
              <Calendar className="mr-2 h-4 w-4 text-orange-500" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">Last 90 Days</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
            <SelectTrigger className="w-[120px] bg-white dark:bg-zinc-900/50">
              <BarChart3 className="mr-2 h-4 w-4 text-emerald-500" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} className="bg-white dark:bg-zinc-900/50">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-white/10 p-1 rounded-xl w-full flex overflow-x-auto justify-start lg:justify-center no-scrollbar">
          <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg flex-shrink-0"><BarChart3 className="h-4 w-4 mr-2" />Overview</TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg flex-shrink-0"><IndianRupee className="h-4 w-4 mr-2" />Revenue</TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg flex-shrink-0"><Users className="h-4 w-4 mr-2" />Members</TabsTrigger>
          <TabsTrigger value="attendance" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-lg flex-shrink-0"><Activity className="h-4 w-4 mr-2" />Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-4 md:gap-4 md:pb-0 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <KPICard title="Total Revenue" value={formatCurrency(revenueData?.summary?.totalRevenue || 0)} change={revenueData?.summary?.revenueChange} icon={IndianRupee} color="orange" loading={loadingRevenue} />
              <KPICard title="Active Members" value={(memberData?.summary?.activeMembers || 0).toLocaleString()} subtitle={`${memberData?.summary?.retentionRate || 0}% retention`} icon={Users} color="emerald" loading={loadingMembers} />
              <KPICard title="Total Check-ins" value={(attendanceData?.summary?.totalCheckIns || 0).toLocaleString()} subtitle={`${attendanceData?.summary?.avgDailyCheckIns || 0} avg/day`} icon={Activity} color="sky" loading={loadingAttendance} />
              <KPICard title="Lead Conversion" value={`${leadsData?.summary?.conversionRate || 0}%`} subtitle={`${leadsData?.summary?.convertedLeads || 0} converted`} icon={Target} color="amber" loading={loadingLeads} />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div variants={item} className="lg:col-span-2">
                <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5 shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div><CardTitle className="text-lg font-bold">Revenue Trend</CardTitle><CardDescription>Revenue over time</CardDescription></div>
                    <Button variant="outline" size="sm" onClick={() => handleExport("revenue")}><FileDown className="h-4 w-4 mr-2" />Export</Button>
                  </CardHeader>
                  <CardContent>
                    {loadingRevenue ? <div className="flex h-[300px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div> : (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={revenueData?.trend || []}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS.orange} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.1} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: "#71717a", fontSize: 10 }} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={10} 
                          />
                          <YAxis 
                            tick={{ fill: "#71717a", fontSize: 10 }} 
                            tickLine={false} 
                            axisLine={false} 
                            dx={-10}
                            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} 
                          />
                          <Tooltip content={<ChartTooltip currency />} cursor={{ stroke: "#27272a", strokeWidth: 1, strokeDasharray: "4 4" }} />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke={COLORS.orange} 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                            activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5 shadow-xl h-full">
                  <CardHeader className="pb-2"><CardTitle className="text-lg font-bold">Revenue by Type</CardTitle></CardHeader>
                  <CardContent>
                    {loadingRevenue ? <div className="flex h-[250px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div> : (
                      <>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie 
                              data={revenueData?.byType || []} 
                              cx="50%" 
                              cy="50%" 
                              innerRadius={60} 
                              outerRadius={85} 
                              paddingAngle={4} 
                              dataKey="revenue"
                              stroke="none"
                            >
                              {(revenueData?.byType || []).map((_: any, i: number) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip content={<ChartTooltip currency />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-2 justify-center mt-2">
                          {(revenueData?.byType || []).map((t: any, i: number) => <Badge key={t.type} variant="secondary" className="text-xs"><span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />{t.type}</Badge>)}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div variants={item}>
                <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5 shadow-xl">
                  <CardHeader className="pb-2"><CardTitle className="text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5 text-emerald-500" />Member Growth</CardTitle></CardHeader>
                  <CardContent>
                    {loadingMembers ? <div className="flex h-[200px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div> : (
                      <ResponsiveContainer width="100%" height={200}>
                        <ComposedChart data={memberData?.growthTrend || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.1} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: "#71717a", fontSize: 10 }} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={5}
                          />
                          <YAxis yAxisId="left" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} dx={-5} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} dx={5} />
                          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                          <Bar yAxisId="left" dataKey="newMembers" fill={COLORS.emerald} radius={[4, 4, 0, 0]} name="New Members" barSize={20} />
                          <Line yAxisId="right" type="monotone" dataKey="totalMembers" stroke={COLORS.orange} strokeWidth={2} name="Total" dot={false} activeDot={{ r: 4 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5 shadow-xl">
                  <CardHeader className="pb-2"><CardTitle className="text-lg font-bold flex items-center gap-2"><Activity className="h-5 w-5 text-sky-500" />Attendance</CardTitle></CardHeader>
                  <CardContent>
                    {loadingAttendance ? <div className="flex h-[200px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-sky-500" /></div> : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={attendanceData?.trend || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.1} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: "#71717a", fontSize: 10 }} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={5}
                          />
                          <YAxis tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} dx={-5} />
                          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                          <Bar dataKey="checkIns" fill={COLORS.sky} radius={[4, 4, 0, 0]} name="Check-ins" barSize={30} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item}>
                <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5 shadow-xl">
                  <CardHeader className="pb-2"><CardTitle className="text-lg font-bold flex items-center gap-2"><Target className="h-5 w-5 text-amber-500" />Lead Funnel</CardTitle></CardHeader>
                  <CardContent>
                    {loadingLeads ? <div className="flex h-[200px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div> : (
                      <div className="space-y-3">
                        {(leadsData?.funnel || []).map((s: any, i: number) => (
                          <div key={s.stage}>
                            <div className="flex justify-between text-sm mb-1"><span className="text-zinc-600 dark:text-zinc-400">{s.stage}</span><span className="font-mono font-semibold">{s.count}</span></div>
                            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${s.percentage}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} /></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="revenue">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-4 md:gap-4 md:pb-0 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <KPICard title="Total Revenue" value={formatCurrency(revenueData?.summary?.totalRevenue || 0)} change={revenueData?.summary?.revenueChange} icon={IndianRupee} color="orange" loading={loadingRevenue} />
              <KPICard title="Previous Period" value={formatCurrency(revenueData?.summary?.previousRevenue || 0)} icon={Clock} color="zinc" loading={loadingRevenue} />
              <KPICard title="Transactions" value={(revenueData?.summary?.totalTransactions || 0).toLocaleString()} icon={CreditCard} color="emerald" loading={loadingRevenue} />
              <KPICard title="Avg. Transaction" value={formatCurrency(revenueData?.summary?.averageTransaction || 0)} icon={Target} color="amber" loading={loadingRevenue} />
            </motion.div>
            <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Revenue by Plan</CardTitle></div></CardHeader>
              <CardContent>
                {loadingRevenueByPlan ? <div className="flex h-[200px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
                  <div className="space-y-4">
                    {(revenueByPlan || []).map((p: any, i: number) => (
                      <div key={p.planId}>
                        <div className="flex justify-between text-sm mb-1"><span className="font-medium">{p.name}</span><span className="font-mono">{formatCurrency(p.revenue)} ({p.percentage}%)</span></div>
                        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${p.percentage}%`, backgroundColor: p.color || CHART_COLORS[i % CHART_COLORS.length] }} /></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="members">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-5 md:gap-4 md:pb-0 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <KPICard title="Total" value={(memberData?.summary?.totalMembers || 0).toLocaleString()} icon={Users} color="orange" loading={loadingMembers} />
              <KPICard title="Active" value={(memberData?.summary?.activeMembers || 0).toLocaleString()} icon={UserCheck} color="emerald" loading={loadingMembers} />
              <KPICard title="New (Period)" value={(memberData?.summary?.newMembersInPeriod || 0).toLocaleString()} icon={UserPlus} color="sky" loading={loadingMembers} />
              <KPICard title="Retention" value={`${memberData?.summary?.retentionRate || 0}%`} icon={Target} color="amber" loading={loadingMembers} />
              <KPICard title="Churned (30d)" value={(memberData?.summary?.churnedLast30Days || 0).toLocaleString()} icon={UserMinus} color="rose" loading={loadingMembers} />
            </motion.div>
            <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5 shadow-xl">
              <CardHeader><CardTitle>Retention Trend</CardTitle></CardHeader>
              <CardContent>
                {loadingRetention ? <div className="flex h-[200px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={retentionData || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.1} />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: "#71717a", fontSize: 10 }} 
                        tickLine={false} 
                        axisLine={false} 
                        dy={5}
                      />
                      <YAxis tick={{ fill: "#71717a", fontSize: 10 }} domain={[0, 100]} tickLine={false} axisLine={false} dx={-5} />
                      <Tooltip content={<ChartTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="retentionRate" 
                        stroke={COLORS.emerald} 
                        strokeWidth={3} 
                        dot={{ fill: COLORS.emerald, r: 4, strokeWidth: 0 }} 
                        activeDot={{ r: 6 }}
                        name="Retention Rate"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="attendance">
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item} className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-4 md:gap-4 md:pb-0 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <KPICard title="Total Check-ins" value={(attendanceData?.summary?.totalCheckIns || 0).toLocaleString()} icon={Activity} color="orange" loading={loadingAttendance} />
              <KPICard title="Unique Days" value={(attendanceData?.summary?.uniqueDays || 0).toLocaleString()} icon={CalendarDays} color="emerald" loading={loadingAttendance} />
              <KPICard title="Avg. Daily" value={(attendanceData?.summary?.avgDailyCheckIns || 0).toLocaleString()} icon={Users} color="sky" loading={loadingAttendance} />
              <KPICard title="Avg. Duration" value={`${attendanceData?.summary?.avgSessionDuration || 0} min`} icon={Clock} color="amber" loading={loadingAttendance} />
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5 shadow-xl">
                <CardHeader><CardTitle>Peak Hours</CardTitle></CardHeader>
                <CardContent>
                  {loadingAttendance ? <div className="flex h-[200px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
                    <div className="space-y-3">
                      {(attendanceData?.peakHours || []).map((h: any, i: number) => (
                        <div key={h.hour} className="flex items-center gap-3">
                          <Badge variant="outline" className="w-16 justify-center font-mono">{h.hour}</Badge>
                          <div className="flex-1 h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(h.checkIns / (attendanceData?.peakHours?.[0]?.checkIns || 1)) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          </div>
                          <span className="font-mono text-sm w-12 text-right">{h.checkIns}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5 shadow-xl">
                <CardHeader><CardTitle>Weekly Pattern</CardTitle></CardHeader>
                <CardContent>
                  {loadingAttendance ? <div className="flex h-[200px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={attendanceData?.dayOfWeekDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.1} />
                        <XAxis 
                          dataKey="day" 
                          tick={{ fill: "#71717a", fontSize: 10 }} 
                          tickLine={false} 
                          axisLine={false} 
                          dy={5}
                        />
                        <YAxis tick={{ fill: "#71717a", fontSize: 10 }} tickLine={false} axisLine={false} dx={-5} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                        <Bar dataKey="checkIns" fill={COLORS.orange} radius={[4, 4, 0, 0]} name="Check-ins" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
