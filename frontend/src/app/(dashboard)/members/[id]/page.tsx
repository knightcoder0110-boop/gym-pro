"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  QrCode,
  Pencil,
  MoreHorizontal,
  AlertCircle,
  Clock,
  Dumbbell,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { membersApi } from "@/lib/api";

interface MemberDetail {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  avatar?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  bloodGroup?: string;
  medicalConditions?: string;
  qrCode: string;
  joinDate: string;
  status: "ACTIVE" | "INACTIVE" | "FROZEN" | "EXPIRED" | "BLOCKED";
  trainer?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  branch?: {
    id: string;
    name: string;
  };
  memberships: Array<{
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    plan: {
      id: string;
      name: string;
      features: string[];
    };
  }>;
}

const statusConfig = {
  ACTIVE: { label: "Active", className: "bg-emerald-500/20 text-emerald-400" },
  INACTIVE: { label: "Inactive", className: "bg-gray-500/20 text-gray-400" },
  EXPIRED: { label: "Expired", className: "bg-red-500/20 text-red-400" },
  FROZEN: { label: "Frozen", className: "bg-blue-500/20 text-blue-400" },
  BLOCKED: { label: "Blocked", className: "bg-red-500/20 text-red-400" },
};

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: member, isLoading, error } = useQuery({
    queryKey: ["member", id],
    queryFn: async () => {
      const response = await membersApi.getById(id);
      return response.data.data as MemberDetail;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <Skeleton className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Member Not Found</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-4">The member you're looking for doesn't exist.</p>
        <Button asChild className="bg-orange-500 text-white hover:bg-orange-600">
          <Link href="/members">Back to Members</Link>
        </Button>
      </div>
    );
  }

  const fullName = `${member.firstName} ${member.lastName}`;
  const initials = `${member.firstName[0]}${member.lastName[0]}`;
  const statusInfo = statusConfig[member.status] || statusConfig.INACTIVE;
  const activeMembership = member.memberships?.find(m => m.status === "ACTIVE");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"
          >
            <Link href="/members">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{fullName}</h1>
            <p className="text-zinc-500 dark:text-zinc-400">{member.memberId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-zinc-200 dark:border-white/10 bg-transparent text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-zinc-200 dark:border-white/10 bg-transparent text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10">
              <DropdownMenuItem className="text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Collect Payment
              </DropdownMenuItem>
              <DropdownMenuItem className="text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5 cursor-pointer">
                <QrCode className="mr-2 h-4 w-4" />
                View QR Code
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer">
                Block Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4 ring-4 ring-white dark:ring-white/5 shadow-xl">
                  <AvatarImage src={member.avatar || ""} />
                  <AvatarFallback className="bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{fullName}</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-4">{member.memberId}</p>
                <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{member.phone}</span>
                </div>
                {member.city && (
                  <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{member.city}{member.state && `, ${member.state}`}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Joined {format(new Date(member.joinDate), "MMM dd, yyyy")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Membership Card */}
          {activeMembership && (
            <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-zinc-900 dark:text-white text-lg">Current Membership</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Plan</span>
                  <Badge className="bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-200 dark:border-orange-500/20">{activeMembership.plan.name}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Expires</span>
                  <span className="text-zinc-900 dark:text-white">{format(new Date(activeMembership.endDate), "MMM dd, yyyy")}</span>
                </div>
                <Button className="w-full mt-4 bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20">
                  Renew Membership
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Trainer Card */}
          {member.trainer && (
            <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-zinc-900 dark:text-white text-lg">Assigned Trainer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.trainer.avatar || ""} />
                    <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
                      {member.trainer.firstName[0]}{member.trainer.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-zinc-900 dark:text-white font-medium">
                      {member.trainer.firstName} {member.trainer.lastName}
                    </p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Personal Trainer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 p-1 w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-500 data-[state=active]:shadow-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="membership" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-500 data-[state=active]:shadow-sm">
                Membership
              </TabsTrigger>
              <TabsTrigger value="attendance" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-500 data-[state=active]:shadow-sm">
                Attendance
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-500 data-[state=active]:shadow-sm">
                Payments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Personal Information */}
              <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5">
                <CardHeader>
                  <CardTitle className="text-zinc-900 dark:text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-orange-500" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Full Name</p>
                    <p className="text-zinc-900 dark:text-white font-medium">{fullName}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Gender</p>
                    <p className="text-zinc-900 dark:text-white font-medium">{member.gender || "-"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Date of Birth</p>
                    <p className="text-zinc-900 dark:text-white font-medium">
                      {member.dateOfBirth ? format(new Date(member.dateOfBirth), "MMM dd, yyyy") : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Blood Group</p>
                    <p className="text-zinc-900 dark:text-white font-medium">{member.bloodGroup || "-"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5">
                <CardHeader>
                  <CardTitle className="text-zinc-900 dark:text-white flex items-center gap-2">
                    <Phone className="h-5 w-5 text-orange-500" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Contact Name</p>
                    <p className="text-zinc-900 dark:text-white font-medium">{member.emergencyName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Phone</p>
                    <p className="text-zinc-900 dark:text-white font-medium">{member.emergencyPhone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">Relationship</p>
                    <p className="text-zinc-900 dark:text-white font-medium">{member.emergencyRelation || "-"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Address */}
              <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5">
                <CardHeader>
                  <CardTitle className="text-zinc-900 dark:text-white flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-orange-500" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {member.address ? (
                    <p className="text-zinc-900 dark:text-white font-medium">
                      {member.address}
                      {member.city && <>, {member.city}</>}
                      {member.state && <>, {member.state}</>}
                      {member.zipCode && <> - {member.zipCode}</>}
                    </p>
                  ) : (
                    <p className="text-zinc-500 dark:text-zinc-400">No address provided</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="membership" className="space-y-4">
              <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5">
                <CardHeader>
                  <CardTitle className="text-zinc-900 dark:text-white">Membership History</CardTitle>
                </CardHeader>
                <CardContent>
                  {member.memberships && member.memberships.length > 0 ? (
                    <div className="space-y-4">
                      {member.memberships.map((membership) => (
                        <div key={membership.id} className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/5">
                          <div>
                            <p className="text-zinc-900 dark:text-white font-medium">{membership.plan.name}</p>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                              {format(new Date(membership.startDate), "MMM dd, yyyy")} - {format(new Date(membership.endDate), "MMM dd, yyyy")}
                            </p>
                          </div>
                          <Badge className={membership.status === "ACTIVE" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-zinc-100 dark:bg-zinc-500/20 text-zinc-500 dark:text-zinc-400"}>
                            {membership.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-500 dark:text-zinc-400 text-center py-8">No membership history</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5">
                <CardHeader>
                  <CardTitle className="text-zinc-900 dark:text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Recent Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-500 dark:text-zinc-400 text-center py-8">
                    Attendance history will be shown here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5">
                <CardHeader>
                  <CardTitle className="text-zinc-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-orange-500" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-500 dark:text-zinc-400 text-center py-8">
                    Payment history will be shown here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
