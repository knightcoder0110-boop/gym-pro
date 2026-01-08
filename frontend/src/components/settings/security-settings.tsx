import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Key, Loader2, Check, Lock, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { settingsApi } from "@/lib/api";

export function SecuritySettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setIsSaving(true);
      await settingsApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to change password");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

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
            <div className="p-2 bg-green-100 dark:bg-green-500/10 rounded-lg shrink-0">
              <Key className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-500" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base md:text-xl text-zinc-900 dark:text-white">
                Password & Security
              </CardTitle>
              <CardDescription className="mt-1 text-xs md:text-sm">
                Manage your password and security preferences.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 md:space-y-8">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-3">
              <Label className="text-zinc-700 dark:text-zinc-300">Current Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-green-500 transition-colors" />
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="pl-10 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:border-green-500/50 focus:ring-green-500/20 transition-all"
                  placeholder="Enter current password"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-zinc-700 dark:text-zinc-300">New Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-green-500 transition-colors" />
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="pl-10 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:border-green-500/50 focus:ring-green-500/20 transition-all"
                  placeholder="Enter new password"
                />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-1">
                Must be at least 6 characters long
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-zinc-700 dark:text-zinc-300">Confirm New Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 group-focus-within:text-green-500 transition-colors" />
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="pl-10 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 focus:border-green-500/50 focus:ring-green-500/20 transition-all"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleChangePassword}
                disabled={isSaving || !passwordForm.currentPassword || !passwordForm.newPassword}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 px-6 w-full sm:w-auto"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Update Password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden relative w-full">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg shrink-0">
              <Shield className="h-4 w-4 md:h-5 md:w-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base md:text-lg text-zinc-900 dark:text-white">
                Two-Factor Authentication
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Add an extra layer of security to your account.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-zinc-200 dark:border-white/10 rounded-xl bg-white dark:bg-zinc-900">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <div className="p-2 md:p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400 shrink-0">
                <Smartphone className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm md:text-base text-zinc-900 dark:text-white">Authenticator App</p>
                <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">
                  Use Google Authenticator or Authy.
                </p>
              </div>
            </div>
            <Button variant="outline" disabled className="bg-transparent border-zinc-200 dark:border-white/10 text-zinc-500 text-xs md:text-sm w-full sm:w-auto">
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
