"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  CreditCard,
  Trash2,
  Download,
  Upload,
  Filter,
  User,
  Users,
  UserX,
  UserCheck,
} from "lucide-react";
import { membersApi } from "@/lib/api";
import { format } from "date-fns";
import { StatsRail, type StatItem } from "@/components/dashboard/stats-rail";

interface Member {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  status: "ACTIVE" | "INACTIVE" | "FROZEN" | "EXPIRED" | "BLOCKED";
  joinDate: string;
  currentMembership?: {
    plan: { name: string };
    endDate: string;
  } | null;
}

interface MembersResponse {
  data: Member[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const statusConfig = {
  ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500 border-emerald-200 dark:border-emerald-500/20" },
  INACTIVE: { label: "Inactive", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400 border-zinc-200 dark:border-zinc-500/20" },
  EXPIRED: { label: "Expired", className: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500 border-red-200 dark:border-red-500/20" },
  FROZEN: { label: "Frozen", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500 border-blue-200 dark:border-blue-500/20" },
  BLOCKED: { label: "Blocked", className: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500 border-red-200 dark:border-red-500/20" },
};

export default function MembersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Delete member mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => membersApi.delete(id),
    onSuccess: () => {
      toast.success("Member deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Failed to delete member");
    },
  });

  const handleEdit = (memberId: string) => {
    router.push(`/members/${memberId}?edit=true`);
  };

  const handleCollectPayment = (memberId: string) => {
    router.push(`/payments?memberId=${memberId}`);
  };

  const handleDelete = (memberId: string, memberName: string) => {
    if (confirm(`Are you sure you want to delete ${memberName}? This action cannot be undone.`)) {
      deleteMutation.mutate(memberId);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["members", page, statusFilter, searchQuery],
    queryFn: async () => {
      const params: any = { page, limit: 20 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const response = await membersApi.getAll(params);
      return response.data as MembersResponse;
    },
  });

  const members = data?.data || [];
  const meta = data?.meta;

  // Calculate stats from the data
  const totalMembers = meta?.total || 0;
  const activeCount = members.filter(m => m.status === "ACTIVE").length;
  const expiredCount = members.filter(m => m.status === "EXPIRED").length;
  const frozenCount = members.filter(m => m.status === "FROZEN").length;

  const stats: StatItem[] = [
    {
      title: "Total Members",
      value: totalMembers.toLocaleString(),
      icon: Users,
      color: "zinc",
    },
    {
      title: "Active",
      value: activeCount.toLocaleString(),
      icon: UserCheck,
      color: "emerald",
    },
    {
      title: "Frozen",
      value: frozenCount.toLocaleString(),
      icon: User,
      color: "blue",
    },
    {
      title: "Expired",
      value: expiredCount.toLocaleString(),
      icon: UserX,
      color: "rose",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Members</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your gym members and their memberships
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" className="border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20">
            <Link href="/members/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsRail stats={stats} loading={isLoading} />

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center bg-white/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 p-4 rounded-xl backdrop-blur-xl shadow-sm">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20 text-zinc-900 dark:text-white placeholder:text-zinc-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px] bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-300">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-300">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expiring">Expiring</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="frozen">Frozen</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 ml-auto md:ml-0">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <Card className="bg-white/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 backdrop-blur-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4 bg-zinc-200 dark:bg-zinc-800" />
                  <Skeleton className="h-3 w-1/6 bg-zinc-200 dark:bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <div className="h-16 w-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-300">No members found</h3>
            <p className="text-sm mt-1 text-zinc-500">Add your first member to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5">
                <TableHead className="text-zinc-500 dark:text-zinc-400">Member</TableHead>
                <TableHead className="text-zinc-500 dark:text-zinc-400">Plan</TableHead>
                <TableHead className="text-zinc-500 dark:text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-500 dark:text-zinc-400">Expiry Date</TableHead>
                <TableHead className="text-zinc-500 dark:text-zinc-400">Phone</TableHead>
                <TableHead className="text-right text-zinc-500 dark:text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const fullName = `${member.firstName} ${member.lastName}`;
                const initials = `${member.firstName[0]}${member.lastName[0]}`;
                const planName = member.currentMembership?.plan?.name || "No Plan";
                const expiryDate = member.currentMembership?.endDate 
                  ? format(new Date(member.currentMembership.endDate), "MMM dd, yyyy")
                  : "-";
                const statusInfo = statusConfig[member.status] || statusConfig.INACTIVE;

                return (
                  <TableRow key={member.id} className="border-zinc-200 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-white/5 group transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-zinc-200 dark:border-white/5">
                          <AvatarImage src={member.avatar || ""} />
                          <AvatarFallback className="bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 text-sm font-medium">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{fullName}</p>
                          <p className="text-xs text-zinc-500">
                            {member.memberId}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/5">{planName}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusInfo.className} border`}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm font-mono">{expiryDate}</TableCell>
                    <TableCell className="text-zinc-600 dark:text-zinc-400 text-sm font-mono">{member.phone}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300">
                          <DropdownMenuItem asChild className="focus:bg-zinc-100 dark:focus:bg-white/10 focus:text-zinc-900 dark:focus:text-white cursor-pointer">
                            <Link href={`/members/${member.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleEdit(member.id)}
                            className="focus:bg-zinc-100 dark:focus:bg-white/10 focus:text-zinc-900 dark:focus:text-white cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleCollectPayment(member.id)}
                            className="focus:bg-zinc-100 dark:focus:bg-white/10 focus:text-zinc-900 dark:focus:text-white cursor-pointer"
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Collect Payment
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(member.id, fullName)}
                            className="text-red-600 dark:text-red-500 focus:bg-red-50 dark:focus:bg-red-500/10 focus:text-red-700 dark:focus:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} members
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
