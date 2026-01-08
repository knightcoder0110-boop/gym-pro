"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  UserPlus,
  Users,
  TrendingUp,
  Phone,
  Mail,
  Plus,
  Search,
  Filter,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  PhoneCall,
  Calendar,
  ArrowRight,
  MoreHorizontal,
  Star,
  Target,
  Zap,
  Globe,
  Instagram,
  Facebook,
  MapPin,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { StatsRail, StatItem } from "@/components/dashboard/stats-rail";

const LEAD_STATUSES = [
  { value: "NEW", label: "New", color: "bg-blue-500", icon: Star },
  { value: "CONTACTED", label: "Contacted", color: "bg-yellow-500", icon: PhoneCall },
  { value: "QUALIFIED", label: "Qualified", color: "bg-purple-500", icon: Target },
  { value: "NEGOTIATION", label: "Negotiation", color: "bg-orange-500", icon: MessageSquare },
  { value: "CONVERTED", label: "Converted", color: "bg-green-500", icon: CheckCircle2 },
  { value: "LOST", label: "Lost", color: "bg-red-500", icon: XCircle },
];

const LEAD_SOURCES = [
  { value: "WALK_IN", label: "Walk-in", icon: MapPin },
  { value: "WEBSITE", label: "Website", icon: Globe },
  { value: "REFERRAL", label: "Referral", icon: Users },
  { value: "SOCIAL_MEDIA", label: "Social Media", icon: Instagram },
  { value: "FACEBOOK", label: "Facebook", icon: Facebook },
  { value: "INSTAGRAM", label: "Instagram", icon: Instagram },
  { value: "GOOGLE", label: "Google", icon: Globe },
  { value: "OTHER", label: "Other", icon: Zap },
];

interface Lead {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone: string;
  source: string;
  status: string;
  interestedIn?: string;
  notes?: string;
  createdAt: string;
  lastContactedAt?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    activities: number;
  };
}

interface LeadStats {
  totalLeads: number;
  byStatus: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
  };
  conversionRate: string;
}

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Lead form state
  const [leadForm, setLeadForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    source: "WALK_IN",
    interestedIn: "",
    notes: "",
  });

  // Fetch leads
  const { data: leadsData, isLoading: loadingLeads } = useQuery({
    queryKey: ["leads", filterStatus, filterSource],
    queryFn: async () => {
      const params: any = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterSource !== "all") params.source = filterSource;
      const res = await leadsApi.getAll(params);
      return res.data.data as Lead[];
    },
  });

  // Fetch stats
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["leads", "stats"],
    queryFn: async () => {
      const res = await leadsApi.getStats();
      return res.data.data as LeadStats;
    },
  });

  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: (data: any) => leadsApi.create(data),
    onSuccess: () => {
      toast.success("Lead added successfully!");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setShowAddModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Failed to add lead");
    },
  });

  // Update lead status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      leadsApi.update(id, { status }),
    onSuccess: () => {
      toast.success("Status updated!");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Failed to update status");
    },
  });

  // Convert to member mutation
  const convertMutation = useMutation({
    mutationFn: (id: string) => leadsApi.convert(id),
    onSuccess: () => {
      toast.success("Lead converted to member!");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setSelectedLead(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Failed to convert lead");
    },
  });

  const resetForm = () => {
    setLeadForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      source: "WALK_IN",
      interestedIn: "",
      notes: "",
    });
  };

  const handleCreateLead = () => {
    if (!leadForm.firstName || !leadForm.phone) {
      toast.error("Please fill in required fields");
      return;
    }
    createLeadMutation.mutate(leadForm);
  };

  const getStatusInfo = (status: string) => {
    return LEAD_STATUSES.find((s) => s.value === status) || LEAD_STATUSES[0];
  };

  const getSourceInfo = (source: string) => {
    return LEAD_SOURCES.find((s) => s.value === source) || LEAD_SOURCES[LEAD_SOURCES.length - 1];
  };

  const filteredLeads = leadsData?.filter(
    (lead) =>
      lead.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group leads by status for Kanban view
  const leadsByStatus = LEAD_STATUSES.reduce((acc, status) => {
    acc[status.value] = filteredLeads?.filter((l) => l.status === status.value) || [];
    return acc;
  }, {} as Record<string, Lead[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Leads & CRM</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your sales pipeline and convert leads
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20">
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-100 dark:bg-orange-500/10 p-2">
                <Users className="h-4 w-4 text-orange-600 dark:text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Total</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white">
                  {loadingStats ? "-" : statsData?.totalLeads || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 dark:bg-blue-500/10 p-2">
                <Star className="h-4 w-4 text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">New</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-500">
                  {loadingStats ? "-" : statsData?.byStatus?.new || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 dark:bg-purple-500/10 p-2">
                <Target className="h-4 w-4 text-purple-600 dark:text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Qualified</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-500">
                  {loadingStats ? "-" : statsData?.byStatus?.qualified || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 dark:bg-green-500/10 p-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Converted</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-500">
                  {loadingStats ? "-" : statsData?.byStatus?.converted || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5 shadow-sm col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 dark:bg-amber-500/10 p-2">
                <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Conversion</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-500">
                  {loadingStats ? "-" : `${statsData?.conversionRate || 0}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20 text-zinc-900 dark:text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-300">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-300">
                  <SelectItem value="all">All Status</SelectItem>
                  {LEAD_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-300">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-300">
                  <SelectItem value="all">All Sources</SelectItem>
                  {LEAD_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5 overflow-hidden">
        <CardHeader className="pb-3 border-b border-zinc-200 dark:border-white/5">
          <CardTitle className="text-lg text-zinc-900 dark:text-white">All Leads</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-white/5 text-left text-sm text-zinc-500 dark:text-zinc-400">
                  <th className="py-4 font-medium">Lead</th>
                  <th className="py-4 font-medium hidden sm:table-cell">Contact</th>
                  <th className="py-4 font-medium hidden md:table-cell">Source</th>
                  <th className="py-4 font-medium">Status</th>
                  <th className="py-4 font-medium hidden lg:table-cell">Added</th>
                  <th className="py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                {loadingLeads ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-400" />
                    </td>
                  </tr>
                ) : filteredLeads?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                      <UserPlus className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                      <p className="mt-2 text-zinc-500 dark:text-zinc-400">No leads found</p>
                      <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowAddModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Lead
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredLeads?.map((lead) => {
                    const statusInfo = getStatusInfo(lead.status);
                    const sourceInfo = getSourceInfo(lead.source);
                    const StatusIcon = statusInfo.icon;
                    const SourceIcon = sourceInfo.icon;

                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-zinc-200 dark:border-white/10">
                              <AvatarFallback className="bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500">
                                {lead.firstName[0]}
                                {lead.lastName?.[0] || ""}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-white">
                                {lead.firstName} {lead.lastName}
                              </p>
                              {lead.interestedIn && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                  Interested in: {lead.interestedIn}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 hidden sm:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-300">
                              <Phone className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
                              {lead.phone}
                            </div>
                            {lead.email && (
                              <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-300">
                                <Mail className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
                                <span className="truncate max-w-[150px]">{lead.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 hidden md:table-cell">
                          <Badge variant="outline" className="text-xs border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300">
                            <SourceIcon className="mr-1 h-3 w-3" />
                            {sourceInfo.label}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge className={`${statusInfo.color} text-white text-xs border-0`}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="py-3 hidden lg:table-cell text-sm text-zinc-500 dark:text-zinc-400">
                          {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {lead.status !== "CONVERTED" && lead.status !== "LOST" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  convertMutation.mutate(lead.id);
                                }}
                                disabled={convertMutation.isPending}
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Lead Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-white">
              <UserPlus className="h-5 w-5 text-orange-500" />
              Add New Lead
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">First Name *</Label>
                <Input
                  value={leadForm.firstName}
                  onChange={(e) => setLeadForm({ ...leadForm, firstName: e.target.value })}
                  placeholder="John"
                  className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-orange-500/20 focus:border-orange-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Last Name</Label>
                <Input
                  value={leadForm.lastName}
                  onChange={(e) => setLeadForm({ ...leadForm, lastName: e.target.value })}
                  placeholder="Doe"
                  className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-orange-500/20 focus:border-orange-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Phone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  className="pl-10 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-orange-500/20 focus:border-orange-500/50"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  className="pl-10 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-orange-500/20 focus:border-orange-500/50"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Source</Label>
                <Select
                  value={leadForm.source}
                  onValueChange={(v) => setLeadForm({ ...leadForm, source: v })}
                >
                  <SelectTrigger className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10">
                    {LEAD_SOURCES.map((source) => (
                      <SelectItem key={source.value} value={source.value} className="text-zinc-900 dark:text-white focus:bg-zinc-100 dark:focus:bg-white/5">
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Interested In</Label>
                <Input
                  value={leadForm.interestedIn}
                  onChange={(e) => setLeadForm({ ...leadForm, interestedIn: e.target.value })}
                  placeholder="Gym membership"
                  className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-orange-500/20 focus:border-orange-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Notes</Label>
              <Textarea
                value={leadForm.notes}
                onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                placeholder="Add any notes about this lead..."
                rows={3}
                className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-orange-500/20 focus:border-orange-500/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleCreateLead} disabled={createLeadMutation.isPending} className="bg-orange-500 hover:bg-orange-600 text-white">
              {createLeadMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Details Modal */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6 py-4">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 ring-orange-500/20">
                  <AvatarFallback className="bg-orange-500 text-white text-xl font-bold">
                    {selectedLead.firstName[0]}
                    {selectedLead.lastName?.[0] || ""}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                    {selectedLead.firstName} {selectedLead.lastName}
                  </h2>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge className={`${getStatusInfo(selectedLead.status).color} text-white border-0`}>
                      {getStatusInfo(selectedLead.status).label}
                    </Badge>
                    <Badge variant="outline" className="border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300">{getSourceInfo(selectedLead.source).label}</Badge>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <Card className="bg-zinc-50/50 dark:bg-zinc-800/20 border-zinc-200 dark:border-white/5 shadow-none">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-zinc-400" />
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Phone</p>
                      <p className="font-medium text-zinc-900 dark:text-white">{selectedLead.phone}</p>
                    </div>
                  </div>
                  {selectedLead.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-zinc-400" />
                      <div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Email</p>
                        <p className="font-medium text-zinc-900 dark:text-white">{selectedLead.email}</p>
                      </div>
                    </div>
                  )}
                  {selectedLead.interestedIn && (
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-zinc-400" />
                      <div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Interested In</p>
                        <p className="font-medium text-zinc-900 dark:text-white">{selectedLead.interestedIn}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-zinc-400" />
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Added</p>
                      <p className="font-medium text-zinc-900 dark:text-white">
                        {format(new Date(selectedLead.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Update Status */}
              {selectedLead.status !== "CONVERTED" && selectedLead.status !== "LOST" && (
                <div className="space-y-2">
                  <Label className="text-zinc-700 dark:text-zinc-300">Update Status</Label>
                  <div className="flex flex-wrap gap-2">
                    {LEAD_STATUSES.filter(
                      (s) => s.value !== selectedLead.status && s.value !== "CONVERTED"
                    ).map((status) => {
                      const StatusIcon = status.icon;
                      return (
                        <Button
                          key={status.value}
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: selectedLead.id,
                              status: status.value,
                            })
                          }
                          disabled={updateStatusMutation.isPending}
                          className="border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300"
                        >
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedLead.notes && (
                <div className="space-y-2">
                  <Label className="text-zinc-700 dark:text-zinc-300">Notes</Label>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-3 border border-zinc-200 dark:border-white/5">
                    {selectedLead.notes}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLead(null)} className="border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5">
              Close
            </Button>
            {selectedLead?.status !== "CONVERTED" && selectedLead?.status !== "LOST" && (
              <Button
                onClick={() => selectedLead && convertMutation.mutate(selectedLead.id)}
                disabled={convertMutation.isPending}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                {convertMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Convert to Member
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
