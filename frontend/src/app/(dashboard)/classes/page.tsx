"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { classesApi, membersApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  Heart,
  Music,
  Sparkles,
  Target,
  Loader2,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CLASS_CATEGORIES = [
  { value: "YOGA", label: "Yoga", icon: Heart, color: "#8b5cf6" },
  { value: "ZUMBA", label: "Zumba", icon: Music, color: "#ec4899" },
  { value: "AEROBICS", label: "Aerobics", icon: Flame, color: "#f97316" },
  { value: "SPINNING", label: "Spinning", icon: Target, color: "#3b82f6" },
  { value: "STRENGTH", label: "Strength", icon: Dumbbell, color: "#10b981" },
  { value: "HIIT", label: "HIIT", icon: Sparkles, color: "#ef4444" },
  { value: "PILATES", label: "Pilates", icon: Heart, color: "#06b6d4" },
  { value: "CROSSFIT", label: "CrossFit", icon: Dumbbell, color: "#f59e0b" },
  { value: "BOXING", label: "Boxing", icon: Target, color: "#dc2626" },
  { value: "DANCE", label: "Dance", icon: Music, color: "#a855f7" },
  { value: "MEDITATION", label: "Meditation", icon: Sparkles, color: "#14b8a6" },
  { value: "OTHER", label: "Other", icon: Dumbbell, color: "#6b7280" },
];

const DIFFICULTY_LEVELS = [
  { value: "BEGINNER", label: "Beginner", color: "bg-green-500" },
  { value: "INTERMEDIATE", label: "Intermediate", color: "bg-yellow-500" },
  { value: "ADVANCED", label: "Advanced", color: "bg-red-500" },
  { value: "ALL_LEVELS", label: "All Levels", color: "bg-blue-500" },
];

interface ClassType {
  id: string;
  name: string;
  description?: string;
  category: string;
  difficulty: string;
  durationMinutes: number;
  maxCapacity: number;
  color?: string;
  isActive: boolean;
  schedules: ScheduleType[];
}

interface ScheduleType {
  id: string;
  classId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location?: string;
  class: {
    id: string;
    name: string;
    color?: string;
    durationMinutes: number;
    category: string;
    difficulty: string;
  };
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  branch: {
    id: string;
    name: string;
  };
  bookedCount?: number;
  availableSpots?: number;
  maxCapacity?: number;
}

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("schedule");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleType | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassType | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedClassForSchedule, setSelectedClassForSchedule] = useState<ClassType | null>(null);

  // Class form state
  const [classForm, setClassForm] = useState({
    name: "",
    description: "",
    category: "OTHER",
    durationMinutes: "60",
    maxCapacity: "20",
    color: "#f97316",
    difficulty: "ALL_LEVELS",
  });

  // Fetch all classes
  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const res = await classesApi.getAll();
      return res.data.data as ClassType[];
    },
  });

  // Fetch weekly schedule
  const { data: weeklyData, isLoading: loadingSchedule } = useQuery({
    queryKey: ["classes", "weekly", currentWeekStart.toISOString()],
    queryFn: async () => {
      const res = await classesApi.getWeeklySchedule({
        weekStart: currentWeekStart.toISOString(),
      });
      return res.data.data;
    },
  });

  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: (data: any) => classesApi.create(data),
    onSuccess: () => {
      toast.success("Class created successfully!");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setShowClassModal(false);
      resetClassForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Failed to create class");
    },
  });

  const resetClassForm = () => {
    setClassForm({
      name: "",
      description: "",
      category: "OTHER",
      durationMinutes: "60",
      maxCapacity: "20",
      color: "#f97316",
      difficulty: "ALL_LEVELS",
    });
  };

  const handleCreateClass = () => {
    if (!classForm.name.trim()) {
      toast.error("Please enter a class name");
      return;
    }
    createClassMutation.mutate({
      name: classForm.name,
      description: classForm.description,
      category: classForm.category,
      durationMinutes: parseInt(classForm.durationMinutes),
      maxCapacity: parseInt(classForm.maxCapacity),
      color: classForm.color,
      difficulty: classForm.difficulty,
    });
  };

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) =>
      direction === "next" ? addDays(prev, 7) : addDays(prev, -7)
    );
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date()));
  };

  const getCategoryInfo = (category: string) => {
    return CLASS_CATEGORIES.find((c) => c.value === category) || CLASS_CATEGORIES[CLASS_CATEGORIES.length - 1];
  };

  const getDifficultyInfo = (difficulty: string) => {
    return DIFFICULTY_LEVELS.find((d) => d.value === difficulty) || DIFFICULTY_LEVELS[3];
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const isCurrentWeek = isSameDay(startOfWeek(new Date()), currentWeekStart);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Classes & Schedule</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your gym classes and schedules
          </p>
        </div>
        <Button onClick={() => setShowClassModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20">
          <Plus className="mr-2 h-4 w-4" />
          New Class
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
          <TabsTrigger value="schedule" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-orange-500">
            <Calendar className="mr-2 h-4 w-4" />
            Weekly Schedule
          </TabsTrigger>
          <TabsTrigger value="classes" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-orange-500">
            <Dumbbell className="mr-2 h-4 w-4" />
            All Classes
          </TabsTrigger>
        </TabsList>

        {/* Weekly Schedule Tab */}
        <TabsContent value="schedule" className="mt-4 space-y-4">
          {/* Week Navigation */}
          <Card className="bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border-zinc-200 dark:border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")} className="border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5">
                    <ChevronLeft className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => navigateWeek("next")} className="border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5">
                    <ChevronRight className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  </Button>
                  {!isCurrentWeek && (
                    <Button variant="ghost" size="sm" onClick={goToToday} className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10">
                      Today
                    </Button>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {format(currentWeekStart, "MMM d")} - {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
                </h2>
                <div className="w-24" />
              </div>
            </CardContent>
          </Card>

          {/* Schedule Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-7">
            {weekDays.map((day, dayIndex) => {
              const isToday = isSameDay(day, new Date());
              const daySchedules = weeklyData?.schedule?.[dayIndex]?.schedules || [];

              return (
                <Card
                  key={dayIndex}
                  className={`bg-white/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-white/5 backdrop-blur-sm min-h-[300px] ${isToday ? "ring-2 ring-orange-500/50 bg-orange-50/50 dark:bg-orange-500/5" : ""}`}
                >
                  <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase font-medium">
                          {DAYS_SHORT[dayIndex]}
                        </p>
                        <p className={`text-xl font-bold ${isToday ? "text-orange-500" : "text-zinc-900 dark:text-white"}`}>
                          {format(day, "d")}
                        </p>
                      </div>
                      {isToday && (
                        <Badge className="bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 text-xs border-orange-200 dark:border-orange-500/20">Today</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-2 pb-2">
                    {loadingSchedule ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                      </div>
                    ) : daySchedules.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Calendar className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">No classes</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {daySchedules.map((schedule: ScheduleType) => {
                          const categoryInfo = getCategoryInfo(schedule.class.category);
                          const ClassIcon = categoryInfo.icon;
                          
                          return (
                            <button
                              key={schedule.id}
                              onClick={() => {
                                setSelectedSchedule(schedule);
                                setShowBookingModal(true);
                              }}
                              className="w-full rounded-lg p-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98] bg-white dark:bg-zinc-800/50 border border-zinc-100 dark:border-white/5 shadow-sm"
                              style={{
                                borderLeft: `3px solid ${schedule.class.color || categoryInfo.color}`,
                              }}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  className="rounded-md p-1.5 shrink-0"
                                  style={{ backgroundColor: `${schedule.class.color || categoryInfo.color}15` }}
                                >
                                  <ClassIcon
                                    className="h-3 w-3"
                                    style={{ color: schedule.class.color || categoryInfo.color }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-xs truncate text-zinc-900 dark:text-zinc-200">{schedule.class.name}</p>
                                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                    {formatTime(schedule.startTime)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* All Classes Tab */}
        <TabsContent value="classes" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loadingClasses ? (
              [1, 2, 3].map((i) => (
                <Card key={i} className="bg-white/80 dark:bg-zinc-900/40 border-zinc-200 dark:border-white/5">
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-4 bg-zinc-200 dark:bg-zinc-800" />
                    <Skeleton className="h-4 w-full mb-2 bg-zinc-200 dark:bg-zinc-800" />
                    <Skeleton className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800" />
                  </CardContent>
                </Card>
              ))
            ) : (
              classesData?.map((classItem) => {
                const categoryInfo = getCategoryInfo(classItem.category);
                const ClassIcon = categoryInfo.icon;
                const difficultyInfo = getDifficultyInfo(classItem.difficulty);

                return (
                  <Card
                    key={classItem.id}
                    className="bg-white/80 dark:bg-zinc-900/40 border-zinc-200 dark:border-white/5 backdrop-blur-xl group hover:border-orange-500/30 transition-all duration-300"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div
                          className="rounded-xl p-3"
                          style={{
                            backgroundColor: `${classItem.color || categoryInfo.color}15`,
                          }}
                        >
                          <ClassIcon
                            className="h-6 w-6"
                            style={{ color: classItem.color || categoryInfo.color }}
                          />
                        </div>
                        <Badge
                          variant="secondary"
                          className={`${difficultyInfo.color} text-white text-xs border-0`}
                        >
                          {difficultyInfo.label}
                        </Badge>
                      </div>

                      <h3 className="mt-4 font-bold text-lg truncate text-zinc-900 dark:text-white">{classItem.name}</h3>
                      
                      {classItem.description && (
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {classItem.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{classItem.durationMinutes} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Max {classItem.maxCapacity}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <Badge variant="outline" className="text-xs border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300">
                          {categoryInfo.label}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <Calendar className="h-3 w-3" />
                          <span>{classItem.schedules?.length || 0} schedules</span>
                        </div>
                      </div>

                      {/* Hover Actions */}
                      <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-white"
                          onClick={() => {
                            setEditingClass(classItem);
                            setClassForm({
                              name: classItem.name,
                              description: classItem.description || "",
                              category: classItem.category,
                              durationMinutes: String(classItem.durationMinutes),
                              maxCapacity: String(classItem.maxCapacity),
                              color: classItem.color || "#f97316",
                              difficulty: classItem.difficulty,
                            });
                            setShowClassModal(true);
                          }}
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-white"
                          onClick={() => {
                            setSelectedClassForSchedule(classItem);
                            toast.info(`Schedule management for "${classItem.name}" coming soon!`);
                          }}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Schedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Class Modal */}
      <Dialog open={showClassModal} onOpenChange={setShowClassModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-white">
              <Dumbbell className="h-5 w-5 text-orange-500" />
              Create New Class
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Class Name *</Label>
              <Input
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                placeholder="e.g., Morning Yoga Flow"
                className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-orange-500/20 focus:border-orange-500/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Description</Label>
              <Textarea
                value={classForm.description}
                onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                placeholder="Describe what this class is about..."
                rows={3}
                className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-orange-500/20 focus:border-orange-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Category</Label>
                <Select
                  value={classForm.category}
                  onValueChange={(v) => setClassForm({ ...classForm, category: v })}
                >
                  <SelectTrigger className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10">
                    {CLASS_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="text-zinc-900 dark:text-white focus:bg-zinc-100 dark:focus:bg-white/5">
                        <div className="flex items-center gap-2">
                          <cat.icon className="h-4 w-4" style={{ color: cat.color }} />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Difficulty</Label>
                <Select
                  value={classForm.difficulty}
                  onValueChange={(v) => setClassForm({ ...classForm, difficulty: v })}
                >
                  <SelectTrigger className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10">
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value} className="text-zinc-900 dark:text-white focus:bg-zinc-100 dark:focus:bg-white/5">
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Duration (minutes)</Label>
                <Input
                  type="number"
                  value={classForm.durationMinutes}
                  onChange={(e) => setClassForm({ ...classForm, durationMinutes: e.target.value })}
                  placeholder="60"
                  className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:ring-orange-500/20 focus:border-orange-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-700 dark:text-zinc-300">Max Capacity</Label>
                <Input
                  type="number"
                  value={classForm.maxCapacity}
                  onChange={(e) => setClassForm({ ...classForm, maxCapacity: e.target.value })}
                  placeholder="20"
                  className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:ring-orange-500/20 focus:border-orange-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Class Color</Label>
              <div className="flex flex-wrap gap-2">
                {CLASS_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setClassForm({ ...classForm, color: cat.color })}
                    className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                      classForm.color === cat.color ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-orange-500" : ""
                    }`}
                    style={{ backgroundColor: cat.color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClassModal(false)} className="border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleCreateClass} disabled={createClassMutation.isPending} className="bg-orange-500 hover:bg-orange-600 text-white">
              {createClassMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class Details / Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white">
          <DialogHeader>
            <DialogTitle>Class Details</DialogTitle>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4 py-4">
              {/* Class Header */}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: `${selectedSchedule.class.color || "#f97316"}15`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="rounded-xl p-3"
                    style={{
                      backgroundColor: `${selectedSchedule.class.color || "#f97316"}25`,
                    }}
                  >
                    {(() => {
                      const cat = getCategoryInfo(selectedSchedule.class.category);
                      const Icon = cat.icon;
                      return (
                        <Icon
                          className="h-8 w-8"
                          style={{ color: selectedSchedule.class.color || cat.color }}
                        />
                      );
                    })()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{selectedSchedule.class.name}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {getCategoryInfo(selectedSchedule.class.category).label}
                    </p>
                    <Badge
                      className={`mt-2 ${getDifficultyInfo(selectedSchedule.class.difficulty).color} text-white border-0`}
                    >
                      {getDifficultyInfo(selectedSchedule.class.difficulty).label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {formatTime(selectedSchedule.startTime)} - {formatTime(selectedSchedule.endTime)}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {selectedSchedule.class.durationMinutes} minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-zinc-400" />
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedSchedule.instructor?.avatar} />
                      <AvatarFallback className="bg-orange-500/10 text-orange-600 dark:text-orange-500">
                        {selectedSchedule.instructor?.firstName?.[0]}
                        {selectedSchedule.instructor?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">
                        {selectedSchedule.instructor?.firstName} {selectedSchedule.instructor?.lastName}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Instructor</p>
                    </div>
                  </div>
                </div>

                {selectedSchedule.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-zinc-400" />
                    <p className="font-medium text-zinc-900 dark:text-white">{selectedSchedule.location}</p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {selectedSchedule.bookedCount || 0} / {selectedSchedule.maxCapacity || 20} booked
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {(selectedSchedule.maxCapacity || 20) - (selectedSchedule.bookedCount || 0)} spots available
                    </p>
                  </div>
                </div>
              </div>

              {/* Capacity Bar */}
              <div className="space-y-2">
                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${((selectedSchedule.bookedCount || 0) / (selectedSchedule.maxCapacity || 20)) * 100}%`,
                      backgroundColor: selectedSchedule.class.color || "#f97316",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingModal(false)} className="border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5">
              Close
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <UserPlus className="mr-2 h-4 w-4" />
              Book Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
