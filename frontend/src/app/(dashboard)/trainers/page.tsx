"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trainersApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Dumbbell,
  Users,
  Calendar,
  Clock,
  Plus,
  Search,
  Mail,
  Phone,
  Star,
  Award,
  TrendingUp,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Camera,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { StatsRail, StatItem } from "@/components/dashboard/stats-rail";

interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    classSchedules: number;
    ptSessions: number;
  };
}

interface TrainerStats {
  totalTrainers: number;
  activeTrainers: number;
  totalClasses: number;
  upcomingPTSessions: number;
}

const SPECIALIZATIONS = [
  { value: "strength", label: "Strength Training", color: "bg-red-500" },
  { value: "cardio", label: "Cardio", color: "bg-blue-500" },
  { value: "yoga", label: "Yoga", color: "bg-purple-500" },
  { value: "hiit", label: "HIIT", color: "bg-orange-500" },
  { value: "crossfit", label: "CrossFit", color: "bg-yellow-500" },
  { value: "pilates", label: "Pilates", color: "bg-pink-500" },
  { value: "boxing", label: "Boxing", color: "bg-gray-500" },
  { value: "nutrition", label: "Nutrition", color: "bg-green-500" },
];

export default function TrainersPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);

  // Trainer form state
  const [trainerForm, setTrainerForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatar: "",
  });

  // Fetch trainers
  const { data: trainersData, isLoading: loadingTrainers } = useQuery({
    queryKey: ["trainers"],
    queryFn: async () => {
      const res = await trainersApi.getAll();
      return res.data.data as Trainer[];
    },
  });

  // Fetch stats
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["trainers", "stats"],
    queryFn: async () => {
      const res = await trainersApi.getStats();
      return res.data.data as TrainerStats;
    },
  });

  // Create trainer mutation
  const createTrainerMutation = useMutation({
    mutationFn: (data: any) => trainersApi.create(data),
    onSuccess: () => {
      toast.success("Trainer added successfully!");
      queryClient.invalidateQueries({ queryKey: ["trainers"] });
      setShowAddModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Failed to add trainer");
    },
  });

  // Delete trainer mutation
  const deleteTrainerMutation = useMutation({
    mutationFn: (id: string) => trainersApi.delete(id),
    onSuccess: () => {
      toast.success("Trainer deactivated successfully!");
      queryClient.invalidateQueries({ queryKey: ["trainers"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Failed to deactivate trainer");
    },
  });

  const resetForm = () => {
    setTrainerForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      avatar: "",
    });
  };

  const handleCreateTrainer = () => {
    if (!trainerForm.firstName || !trainerForm.lastName || !trainerForm.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    createTrainerMutation.mutate(trainerForm);
  };

  const filteredTrainers = trainersData?.filter(
    (trainer) =>
      trainer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Trainers</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your gym trainers and instructors
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20">
          <Plus className="mr-2 h-4 w-4" />
          Add Trainer
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsRail
        stats={[
          {
            title: "Total Trainers",
            value: statsData?.totalTrainers?.toString() || "0",
            icon: Users,
            color: "orange",
            description: "All trainers",
          },
          {
            title: "Active Trainers",
            value: statsData?.activeTrainers?.toString() || "0",
            icon: CheckCircle,
            color: "emerald",
            description: "Currently active",
          },
          {
            title: "Total Classes",
            value: statsData?.totalClasses?.toString() || "0",
            icon: Calendar,
            color: "blue",
            description: "Scheduled classes",
          },
          {
            title: "Upcoming PT Sessions",
            value: statsData?.upcomingPTSessions?.toString() || "0",
            icon: Dumbbell,
            color: "purple",
            description: "Personal training",
          },
        ]}
        loading={loadingStats}
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Search trainers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white/80 dark:bg-zinc-900/40 border-zinc-200 dark:border-white/10 backdrop-blur-xl focus:border-orange-500/50 focus:ring-orange-500/20 text-zinc-900 dark:text-white placeholder:text-zinc-500"
        />
      </div>

      {/* Trainers Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loadingTrainers ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="bg-white/80 dark:bg-zinc-900/40 border-zinc-200 dark:border-white/5 backdrop-blur-xl animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="flex-1">
                    <div className="h-5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="mt-2 h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredTrainers?.length === 0 ? (
          <Card className="col-span-full bg-white/80 dark:bg-zinc-900/40 border-zinc-200 dark:border-white/5 backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Dumbbell className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
              <p className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-300">No trainers found</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {searchQuery ? "Try a different search" : "Add your first trainer to get started"}
              </p>
              {!searchQuery && (
                <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowAddModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Trainer
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredTrainers?.map((trainer) => (
            <Card
              key={trainer.id}
              className="bg-white/80 dark:bg-zinc-900/40 border-zinc-200 dark:border-white/5 backdrop-blur-xl group hover:shadow-xl hover:border-orange-500/30 transition-all duration-300 overflow-hidden"
            >
              {/* Status indicator */}
              <div className={`h-1 ${trainer.isActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
              
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 ring-orange-500/20">
                    <AvatarImage src={trainer.avatar} />
                    <AvatarFallback className="bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 text-lg font-bold">
                      {trainer.firstName[0]}
                      {trainer.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold truncate text-zinc-900 dark:text-white">
                        {trainer.firstName} {trainer.lastName}
                      </h3>
                      {trainer.isActive ? (
                        <Badge className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 text-[10px] shadow-none border-0 px-1.5">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-0 px-1.5">Inactive</Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="mt-1 text-[10px] border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400">
                      {trainer.role}
                    </Badge>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-2.5 text-sm text-zinc-500 dark:text-zinc-400">
                    <Mail className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <span className="truncate">{trainer.email}</span>
                  </div>
                  {trainer.phone && (
                    <div className="flex items-center gap-2.5 text-sm text-zinc-500 dark:text-zinc-400">
                      <Phone className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                      <span>{trainer.phone}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-white/5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span>{trainer._count?.classSchedules || 0} classes</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                    <Dumbbell className="h-4 w-4 text-purple-500" />
                    <span>{trainer._count?.ptSessions || 0} PT</span>
                  </div>
                </div>

                {/* Hover Actions */}
                <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-white"
                    onClick={() => setSelectedTrainer(trainer)}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-white"
                    onClick={() => {
                      setSelectedTrainer(trainer);
                      toast.info("Edit trainer feature coming soon!");
                    }}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-zinc-200 dark:border-white/10 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/20"
                    onClick={() => {
                      if (confirm("Are you sure you want to deactivate this trainer?")) {
                        deleteTrainerMutation.mutate(trainer.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Trainer Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-white">
              <Dumbbell className="h-5 w-5 text-orange-500" />
              Add New Trainer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3 pb-4 border-b border-zinc-200 dark:border-white/5">
              <Label className="text-zinc-700 dark:text-zinc-300 flex items-center gap-2 text-sm">
                <Camera className="w-4 h-4" />
                Profile Photo (Optional)
              </Label>
              <FileUpload
                category="TRAINER_AVATAR"
                variant="avatar"
                value={trainerForm.avatar || undefined}
                onChange={(url) => setTrainerForm({ ...trainerForm, avatar: url || "" })}
                onUploadComplete={() => toast.success("Photo uploaded!")}
                onUploadError={(error) => toast.error(`Upload failed: ${error.message}`)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">First Name *</Label>
                <Input
                  value={trainerForm.firstName}
                  onChange={(e) => setTrainerForm({ ...trainerForm, firstName: e.target.value })}
                  placeholder="John"
                  className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-orange-500/20 focus:border-orange-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Last Name *</Label>
                <Input
                  value={trainerForm.lastName}
                  onChange={(e) => setTrainerForm({ ...trainerForm, lastName: e.target.value })}
                  placeholder="Doe"
                  className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-orange-500/20 focus:border-orange-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="email"
                  value={trainerForm.email}
                  onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                  className="pl-10 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-orange-500/20 focus:border-orange-500/50"
                  placeholder="trainer@gym.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  value={trainerForm.phone}
                  onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                  className="pl-10 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-orange-500/20 focus:border-orange-500/50"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Info note */}
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-3 text-sm text-zinc-500 dark:text-zinc-400">
              <p>
                The trainer will receive an email to set up their account password and complete their profile.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} className="border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleCreateTrainer} disabled={createTrainerMutation.isPending} className="bg-orange-500 hover:bg-orange-600 text-white">
              {createTrainerMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Trainer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trainer Details Modal */}
      <Dialog open={!!selectedTrainer} onOpenChange={() => setSelectedTrainer(null)}>
        <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white">
          <DialogHeader>
            <DialogTitle>Trainer Profile</DialogTitle>
          </DialogHeader>
          {selectedTrainer && (
            <div className="space-y-6 py-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 ring-4 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 ring-orange-500/20">
                  <AvatarImage src={selectedTrainer.avatar} />
                  <AvatarFallback className="bg-orange-500 text-white text-2xl font-bold">
                    {selectedTrainer.firstName[0]}
                    {selectedTrainer.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                    {selectedTrainer.firstName} {selectedTrainer.lastName}
                  </h2>
                  <Badge variant="outline" className="mt-1 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300">
                    {selectedTrainer.role}
                  </Badge>
                  <div className="mt-2">
                    {selectedTrainer.isActive ? (
                      <Badge className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 shadow-none border-0">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        <XCircle className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <Card className="bg-zinc-50/50 dark:bg-zinc-800/20 border-zinc-200 dark:border-white/5 shadow-none">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-zinc-400" />
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Email</p>
                      <p className="font-medium text-zinc-900 dark:text-white">{selectedTrainer.email}</p>
                    </div>
                  </div>
                  {selectedTrainer.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-zinc-400" />
                      <div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Phone</p>
                        <p className="font-medium text-zinc-900 dark:text-white">{selectedTrainer.phone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-zinc-400" />
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Joined</p>
                      <p className="font-medium text-zinc-900 dark:text-white">
                        {format(new Date(selectedTrainer.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 shadow-none">
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-8 w-8 mx-auto text-blue-600 dark:text-blue-500" />
                    <p className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {selectedTrainer._count?.classSchedules || 0}
                    </p>
                    <p className="text-sm text-blue-600/80 dark:text-blue-400/80">Classes</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20 shadow-none">
                  <CardContent className="p-4 text-center">
                    <Dumbbell className="h-8 w-8 mx-auto text-purple-600 dark:text-purple-500" />
                    <p className="mt-2 text-2xl font-bold text-purple-700 dark:text-purple-400">
                      {selectedTrainer._count?.ptSessions || 0}
                    </p>
                    <p className="text-sm text-purple-600/80 dark:text-purple-400/80">PT Sessions</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTrainer(null)} className="border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5">
              Close
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => {
                toast.info("Trainer schedule view coming soon!");
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              View Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
