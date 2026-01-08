import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, Mail, Smartphone, Radio, Zap, Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    emailNewMember: true,
    emailPayment: true,
    emailExpiring: true,
    pushCheckIn: true,
    pushPayment: false,
    marketingEmails: false,
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const newState = { ...prev, [key]: !prev[key] };
      // In a real app, we would save this to the backend
      toast.success("Preference updated");
      return newState;
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 w-full"
    >
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {/* Email Notifications Card */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 shadow-sm h-full w-full">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-pink-100 dark:bg-pink-500/10 rounded-lg shrink-0">
                <Mail className="h-4 w-4 md:h-5 md:w-5 text-pink-600 dark:text-pink-500" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base md:text-lg text-zinc-900 dark:text-white">Email Alerts</CardTitle>
                <CardDescription className="text-xs md:text-sm">Manage your email subscriptions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">New Members</p>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500">Core</Badge>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  When a new member registers
                </p>
              </div>
              <Switch
                checked={notifications.emailNewMember}
                onCheckedChange={() => handleToggle("emailNewMember")}
                className="data-[state=checked]:bg-pink-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">Payments</p>
                  <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Successful payment receipts
                </p>
              </div>
              <Switch
                checked={notifications.emailPayment}
                onCheckedChange={() => handleToggle("emailPayment")}
                className="data-[state=checked]:bg-pink-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">Expirations</p>
                  <Clock className="w-3 h-3 text-zinc-400" />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  7 days before expiry
                </p>
              </div>
              <Switch
                checked={notifications.emailExpiring}
                onCheckedChange={() => handleToggle("emailExpiring")}
                className="data-[state=checked]:bg-pink-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications Card */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 shadow-sm h-full w-full">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-lg shrink-0">
                <Smartphone className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-500" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base md:text-lg text-zinc-900 dark:text-white">Push Notifications</CardTitle>
                <CardDescription className="text-xs md:text-sm">Instant alerts on your devices</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">Check-ins</p>
                  <Radio className="w-3 h-3 text-green-500" />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Real-time entry alerts
                </p>
              </div>
              <Switch
                checked={notifications.pushCheckIn}
                onCheckedChange={() => handleToggle("pushCheckIn")}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-white">Transaction Alerts</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Instant payment notifications
                </p>
              </div>
              <Switch
                checked={notifications.pushPayment}
                onCheckedChange={() => handleToggle("pushPayment")}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
            
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-500/5 rounded-xl border border-purple-100 dark:border-purple-500/10">
              <p className="text-xs text-purple-700 dark:text-purple-400 font-medium mb-1">
                Did you know?
              </p>
              <p className="text-xs text-purple-600/80 dark:text-purple-400/80 leading-relaxed">
                You can configure specific device permissions in your browser or phone settings to ensure you never miss an alert.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketing Preferences */}
      <Card className="bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-white/5 shadow-sm w-full">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <p className="font-medium text-sm md:text-base text-zinc-900 dark:text-white">Marketing Communications</p>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">
                Receive news, updates, and special offers from GymPro.
              </p>
            </div>
            <Switch
              checked={notifications.marketingEmails}
              onCheckedChange={() => handleToggle("marketingEmails")}
              className="shrink-0"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
