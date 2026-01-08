import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Camera, Save, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { settingsApi } from "@/lib/api";

interface ProfileSettingsProps {
  user: any;
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatar: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await settingsApi.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        avatar: formData.avatar,
      });
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Avatar Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow w-full">
          <div className="h-24 md:h-32 bg-linear-to-r from-orange-500/20 via-pink-500/20 to-purple-500/20 relative">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
          </div>
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 md:gap-6 -mt-12 md:-mt-16 px-2 md:px-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-white dark:border-zinc-900 shadow-xl ring-4 ring-black/5 dark:ring-white/5">
                  <AvatarImage src={formData.avatar} className="object-cover" />
                  <AvatarFallback className="bg-linear-to-br from-orange-500 to-amber-600 text-white text-3xl md:text-4xl font-bold">
                    {formData.firstName?.[0]}
                    {formData.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <button 
                  className="absolute bottom-0 right-0 md:bottom-1 md:right-1 rounded-full bg-orange-500 p-2 md:p-2.5 text-white shadow-lg hover:bg-orange-600 transition-all hover:scale-110 border-4 border-white dark:border-zinc-900 group-hover:rotate-12"
                  aria-label="Change avatar"
                >
                  <Camera className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </button>
              </div>
              <div className="flex-1 mb-2 space-y-2 w-full min-w-0">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 flex-wrap">
                    <span className="truncate">{user?.firstName} {user?.lastName}</span>
                    <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
                  </h2>
                  <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 font-medium truncate">{user?.email}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20 px-2 md:px-3 py-1 hover:bg-orange-200 transition-colors text-xs">
                    {user?.role || "Staff"}
                  </Badge>
                  {user?.organization && (
                    <Badge variant="outline" className="text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-xs truncate max-w-[200px]">
                      {user.organization.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 shadow-sm w-full">
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2 text-zinc-900 dark:text-white">
              <User className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
              Personal Information
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Update your personal details and public profile info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 md:space-y-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-3">
                <Label className="text-zinc-700 dark:text-zinc-300">First Name</Label>
                <div className="relative group">
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20 text-zinc-900 dark:text-white transition-all pl-10"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-zinc-700 dark:text-zinc-300">Last Name</Label>
                <div className="relative group">
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                    className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20 text-zinc-900 dark:text-white transition-all pl-10"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-zinc-700 dark:text-zinc-300">Email Address</Label>
              <div className="relative opacity-70">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                  className="pl-10 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-white/10 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                />
              </div>
              <p className="text-[13px] text-zinc-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                Email cannot be changed directly for security reasons.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-zinc-700 dark:text-zinc-300">Phone Number</Label>
              <div className="relative group">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="pl-10 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20 text-zinc-900 dark:text-white transition-all"
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-white/5">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 px-8"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
