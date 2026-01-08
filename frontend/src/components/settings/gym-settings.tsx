import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Globe, MapPin, Save, Loader2, AlertTriangle, Map } from "lucide-react";
import { toast } from "sonner";
import { settingsApi } from "@/lib/api";

interface GymSettingsProps {
  user: any;
}

export function GymSettings({ user }: GymSettingsProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "",
    timezone: "Asia/Kolkata",
    currency: "INR",
  });

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (user?.organization) {
      setFormData({
        name: user.organization.name || "",
        email: user.organization.email || "",
        phone: user.organization.phone || "",
        website: user.organization.website || "",
        address: user.organization.address || "",
        city: user.organization.city || "",
        state: user.organization.state || "",
        country: user.organization.country || "",
        timezone: user.organization.timezone || "Asia/Kolkata",
        currency: user.organization.currency || "INR",
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error("Only admins can update gym settings");
      return;
    }

    try {
      setIsSaving(true);
      await settingsApi.updateOrganization(formData);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Gym settings updated successfully!");
    } catch (error) {
      toast.error("Failed to update gym settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user?.organization) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="bg-amber-500/10 border-amber-500/20 shadow-none">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-amber-500/10 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-700 dark:text-amber-500 text-lg">No Organization Found</h3>
              <p className="text-amber-600/80 dark:text-amber-500/80">
                You are not associated with any organization. Please contact support.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 w-full"
    >
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 shadow-sm w-full">
        <CardHeader className="border-b border-zinc-100 dark:border-white/5 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-orange-100 dark:bg-orange-500/10 rounded-lg shrink-0">
              <Building2 className="h-4 w-4 md:h-5 md:w-5 text-orange-600 dark:text-orange-500" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base md:text-xl text-zinc-900 dark:text-white">
                Organization Details
              </CardTitle>
              <CardDescription className="mt-1 text-xs md:text-sm">
                {isAdmin 
                  ? "Manage your gym's public profile and contact info" 
                  : "View your gym's details (Only admins can edit)"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-3 sm:col-span-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Gym Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isAdmin}
                className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20 text-lg font-medium"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-zinc-700 dark:text-zinc-300">Official Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isAdmin}
                className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-zinc-700 dark:text-zinc-300">Phone Number</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isAdmin}
                className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-zinc-700 dark:text-zinc-300">Website</Label>
            <div className="relative group">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                disabled={!isAdmin}
                className="pl-10 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20"
                placeholder="https://"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-zinc-700 dark:text-zinc-300">Address</Label>
            <div className="relative group">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isAdmin}
                className="min-h-[80px] pl-10 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20 resize-none"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-3">
              <Label className="text-zinc-700 dark:text-zinc-300">City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                disabled={!isAdmin}
                className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-zinc-700 dark:text-zinc-300">State</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                disabled={!isAdmin}
                className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-zinc-700 dark:text-zinc-300">Country</Label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                disabled={!isAdmin}
                className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:border-orange-500/50 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-zinc-100 dark:border-white/5">
            <div className="space-y-3">
              <Label className="text-zinc-700 dark:text-zinc-300">Timezone</Label>
              <Select 
                value={formData.timezone} 
                onValueChange={(val) => setFormData({ ...formData, timezone: val })}
                disabled={!isAdmin}
              >
                <SelectTrigger className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-zinc-700 dark:text-zinc-300">Currency</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(val) => setFormData({ ...formData, currency: val })}
                disabled={!isAdmin}
              >
                <SelectTrigger className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-6 border-t border-zinc-100 dark:border-white/5">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 px-6 md:px-8 w-full sm:w-auto text-sm"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                <span className="hidden sm:inline">Save Organization Settings</span>
                <span className="sm:hidden">Save Settings</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
