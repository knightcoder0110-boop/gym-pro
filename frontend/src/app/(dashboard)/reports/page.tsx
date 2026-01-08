"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, paymentsApi, attendanceApi, membersApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  IndianRupee,
  Calendar,
  Clock,
  Activity,
  Download,
  RefreshCw,
  Loader2,
  UserPlus,
  UserMinus,
  CreditCard,
  Banknote,
  Wallet,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  expiringThisWeek: number;
  todayCheckIns: number;
  currentlyInGym: number;
  monthlyRevenue: number;
  pendingDues: number;
}

interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  byMethod: Array<{ paymentMethod: string; _sum: { amount: number }; _count: number }>;
  byType: Array<{ type: string; _sum: { amount: number }; _count: number }>;
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch dashboard stats
  const { data: dashboardData, isLoading: loadingDashboard, refetch: refetchDashboard } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const res = await dashboardApi.getStats();
      return res.data.data as DashboardStats;
    },
  });

  // Fetch payment stats
  const { data: paymentStats, isLoading: loadingPayments } = useQuery({
    queryKey: ["payments", "stats", dateRange],
    queryFn: async () => {
      const params: any = {};
      const today = new Date();
      
      if (dateRange === "week") {
        params.startDate = startOfWeek(today).toISOString();
        params.endDate = endOfWeek(today).toISOString();
      } else if (dateRange === "month") {
        params.startDate = startOfMonth(today).toISOString();
        params.endDate = endOfMonth(today).toISOString();
      } else if (dateRange === "quarter") {
        params.startDate = subDays(today, 90).toISOString();
        params.endDate = today.toISOString();
      }
      
      const res = await paymentsApi.getStats(params);
      return res.data.data as PaymentStats;
    },
  });

  // Fetch members for member stats
  const { data: membersData, isLoading: loadingMembers } = useQuery({
    queryKey: ["members", "stats"],
    queryFn: async () => {
      const res = await membersApi.getAll({ limit: 1000 });
      return res.data.data;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Calculate member stats from data
  const memberStats = {
    total: membersData?.total || 0,
    active: membersData?.members?.filter((m: any) => m.status === "ACTIVE").length || 0,
    inactive: membersData?.members?.filter((m: any) => m.status === "INACTIVE").length || 0,
    frozen: membersData?.members?.filter((m: any) => m.status === "FROZEN").length || 0,
    expired: membersData?.members?.filter((m: any) => m.status === "EXPIRED").length || 0,
  };

  // Payment method distribution
  const paymentMethodData = paymentStats?.byMethod || [];
  const totalPaymentAmount = paymentMethodData.reduce((sum, m) => sum + (m._sum.amount || 0), 0);

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CASH: "Cash",
      CARD: "Card",
      UPI: "UPI",
      NET_BANKING: "Net Banking",
      BANK_TRANSFER: "Bank Transfer",
      WALLET: "Wallet",
    };
    return labels[method] || method;
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      CASH: "bg-green-500",
      CARD: "bg-blue-500",
      UPI: "bg-purple-500",
      NET_BANKING: "bg-orange-500",
      BANK_TRANSFER: "bg-cyan-500",
      WALLET: "bg-pink-500",
    };
    return colors[method] || "bg-gray-500";
  };

  const isLoading = loadingDashboard || loadingPayments || loadingMembers;

  const stats: StatItem[] = [
    {
      title: "Total Members",
      value: (dashboardData?.totalMembers || 0).toLocaleString(),
      change: `+${dashboardData?.newMembersThisMonth || 0} this month`,
      changeType: "positive",
      icon: Users,
      color: "orange",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(dashboardData?.monthlyRevenue || 0),
      change: `${paymentStats?.totalTransactions || 0} transactions`,
      changeType: "neutral",
      icon: IndianRupee,
      color: "emerald",
    },
    {
      title: "Today's Check-ins",
      value: (dashboardData?.todayCheckIns || 0).toLocaleString(),
      change: `${dashboardData?.currentlyInGym || 0} currently in gym`,
      changeType: "neutral",
      icon: Activity,
      color: "blue",
    },
    {
      title: "Expiring Soon",
      value: (dashboardData?.expiringThisWeek || 0).toLocaleString(),
      change: "This week",
      changeType: "negative", // Expiring is usually negative/urgent
      icon: Clock,
      color: "rose",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Track your gym&apos;s performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetchDashboard()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Key Metrics */}
          <StatsRail stats={stats} loading={isLoading} />

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Payment Methods */}
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPayments ? (
                  <div className="flex h-[200px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : paymentMethodData.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                    No payment data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Visual bar chart */}
                    <div className="flex h-4 w-full overflow-hidden rounded-full">
                      {paymentMethodData.map((method, index) => {
                        const percentage = totalPaymentAmount > 0 
                          ? (method._sum.amount / totalPaymentAmount) * 100 
                          : 0;
                        return (
                          <div
                            key={method.paymentMethod}
                            className={`${getMethodColor(method.paymentMethod)} transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-3">
                      {paymentMethodData.map((method) => {
                        const percentage = totalPaymentAmount > 0 
                          ? ((method._sum.amount / totalPaymentAmount) * 100).toFixed(1) 
                          : "0";
                        return (
                          <div key={method.paymentMethod} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`h-3 w-3 rounded-full ${getMethodColor(method.paymentMethod)}`} />
                              <span className="text-sm">{getMethodLabel(method.paymentMethod)}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{formatCurrency(method._sum.amount)}</p>
                              <p className="text-xs text-muted-foreground">{percentage}%</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Member Status */}
            <Card className="bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Member Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMembers ? (
                  <div className="flex h-[200px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Status bars */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Active</span>
                          <span className="font-semibold text-green-500">{memberStats.active}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{
                              width: `${memberStats.total > 0 ? (memberStats.active / memberStats.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Inactive</span>
                          <span className="font-semibold text-gray-500">{memberStats.inactive}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-gray-500 transition-all"
                            style={{
                              width: `${memberStats.total > 0 ? (memberStats.inactive / memberStats.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Frozen</span>
                          <span className="font-semibold text-blue-500">{memberStats.frozen}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{
                              width: `${memberStats.total > 0 ? (memberStats.frozen / memberStats.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Expired</span>
                          <span className="font-semibold text-red-500">{memberStats.expired}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-red-500 transition-all"
                            style={{
                              width: `${memberStats.total > 0 ? (memberStats.expired / memberStats.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-2xl font-bold text-primary">
                    {memberStats.total > 0 ? ((memberStats.active / memberStats.total) * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Active Rate</p>
                </div>
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(paymentStats?.totalRevenue || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Period Revenue</p>
                </div>
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-2xl font-bold text-blue-500">
                    {paymentStats?.totalTransactions || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                </div>
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-2xl font-bold text-orange-500">
                    {formatCurrency(dashboardData?.pendingDues || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending Dues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-green-500/10 p-4">
                    <IndianRupee className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(paymentStats?.totalRevenue || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-blue-500/10 p-4">
                    <CreditCard className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold">{paymentStats?.totalTransactions || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-purple-500/10 p-4">
                    <TrendingUp className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Transaction</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        paymentStats?.totalTransactions 
                          ? (paymentStats.totalRevenue / paymentStats.totalTransactions) 
                          : 0
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Type */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Revenue by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPayments ? (
                <div className="flex h-[200px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {(paymentStats?.byType || []).map((type) => {
                    const percentage = paymentStats?.totalRevenue 
                      ? ((type._sum.amount / paymentStats.totalRevenue) * 100).toFixed(1) 
                      : "0";
                    return (
                      <div key={type.type} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <Badge variant="secondary">{type.type}</Badge>
                            <span className="text-muted-foreground">{type._count} payments</span>
                          </span>
                          <span className="font-semibold">{formatCurrency(type._sum.amount)}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {(!paymentStats?.byType || paymentStats.byType.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No payment data available</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-card">
              <CardContent className="p-6 text-center">
                <div className="inline-flex rounded-full bg-primary/10 p-4 mb-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <p className="text-3xl font-bold">{memberStats.total}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-6 text-center">
                <div className="inline-flex rounded-full bg-green-500/10 p-4 mb-3">
                  <UserPlus className="h-6 w-6 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-green-500">{memberStats.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-6 text-center">
                <div className="inline-flex rounded-full bg-blue-500/10 p-4 mb-3">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-blue-500">{memberStats.frozen}</p>
                <p className="text-sm text-muted-foreground">Frozen</p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="p-6 text-center">
                <div className="inline-flex rounded-full bg-red-500/10 p-4 mb-3">
                  <UserMinus className="h-6 w-6 text-red-500" />
                </div>
                <p className="text-3xl font-bold text-red-500">{memberStats.expired}</p>
                <p className="text-sm text-muted-foreground">Expired</p>
              </CardContent>
            </Card>
          </div>

          {/* Member Distribution */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Member Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-8 w-full overflow-hidden rounded-full">
                <div
                  className="bg-green-500 transition-all flex items-center justify-center text-xs font-medium text-white"
                  style={{ width: `${memberStats.total > 0 ? (memberStats.active / memberStats.total) * 100 : 0}%` }}
                >
                  {memberStats.total > 0 && memberStats.active > 0 && 
                    `${((memberStats.active / memberStats.total) * 100).toFixed(0)}%`}
                </div>
                <div
                  className="bg-gray-500 transition-all flex items-center justify-center text-xs font-medium text-white"
                  style={{ width: `${memberStats.total > 0 ? (memberStats.inactive / memberStats.total) * 100 : 0}%` }}
                />
                <div
                  className="bg-blue-500 transition-all flex items-center justify-center text-xs font-medium text-white"
                  style={{ width: `${memberStats.total > 0 ? (memberStats.frozen / memberStats.total) * 100 : 0}%` }}
                />
                <div
                  className="bg-red-500 transition-all flex items-center justify-center text-xs font-medium text-white"
                  style={{ width: `${memberStats.total > 0 ? (memberStats.expired / memberStats.total) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Active ({memberStats.active})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-500" />
                  <span className="text-sm">Inactive ({memberStats.inactive})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Frozen ({memberStats.frozen})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm">Expired ({memberStats.expired})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-500/10 p-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Retention Rate</p>
                      <p className="text-2xl font-bold text-green-500">
                        {memberStats.total > 0 
                          ? ((memberStats.active / memberStats.total) * 100).toFixed(1) 
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-orange-500/10 p-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Expiring This Week</p>
                      <p className="text-2xl font-bold text-orange-500">
                        {dashboardData?.expiringThisWeek || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-500/10 p-2">
                      <UserPlus className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold">New This Month</p>
                      <p className="text-2xl font-bold text-blue-500">
                        {dashboardData?.newMembersThisMonth || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-purple-500/10 p-2">
                      <Activity className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-semibold">Avg. Daily Check-ins</p>
                      <p className="text-2xl font-bold text-purple-500">
                        {dashboardData?.todayCheckIns || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
