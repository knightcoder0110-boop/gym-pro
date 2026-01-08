"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  CreditCard,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import { authApi } from "@/lib/api";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { GymSettings } from "@/components/settings/gym-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { BillingSettings } from "@/components/settings/billing-settings";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    timezone?: string;
    currency?: string;
  };
}

const tabs = [
  {
    id: "profile",
    label: "My Profile",
    icon: User,
  },
  {
    id: "gym",
    label: "Organization",
    icon: Building2,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
  },
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await authApi.me();
      return res.data.data as UserProfile;
    },
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 md:space-y-8 min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400">
          Manage your account and preferences.
        </p>
      </div>

      {/* Horizontal Navigation Tabs */}
      <div className="sticky top-0 z-30 bg-zinc-50/95 dark:bg-energy-dark/95 backdrop-blur-md border-b border-zinc-200/50 dark:border-white/5 rounded-xl">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3 w-full px-4 touch-pan-x scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative shrink-0 flex items-center gap-2 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
                activeTab === tab.id
                  ? "text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5"
              )}
            >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-zinc-900 dark:bg-white rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5 md:gap-2">
                  <tab.icon className={cn("w-3.5 h-3.5 md:w-4 md:h-4", activeTab === tab.id ? "text-white dark:text-zinc-900" : "currentColor")} />
                  <span className={cn(activeTab === tab.id ? "text-white dark:text-zinc-900" : "currentColor")}>
                    {tab.label}
                  </span>
                </span>
              </button>
            ))}
          </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px] w-full overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {activeTab === "profile" && <ProfileSettings user={user} />}
            {activeTab === "gym" && <GymSettings user={user} />}
            {activeTab === "security" && <SecuritySettings />}
            {activeTab === "notifications" && <NotificationSettings />}
            {activeTab === "appearance" && <AppearanceSettings />}
            {activeTab === "billing" && <BillingSettings />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
