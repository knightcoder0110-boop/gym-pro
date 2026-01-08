"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null) {
      setSidebarCollapsed(saved === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-zinc-50 dark:bg-energy-dark relative overflow-hidden selection:bg-orange-500/30">
        {/* Background Patterns */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-zinc-50 dark:bg-energy-dark" />
          <div className="absolute inset-0 grid-pattern opacity-[0.05] dark:opacity-[0.12]" />
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-[128px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-[128px]" />
        </div>

        {/* Desktop Sidebar - Floating Style */}
        <div 
          className={`hidden lg:block fixed left-6 top-6 bottom-6 z-30 transition-all duration-300 ${sidebarCollapsed ? "w-[80px]" : "w-[280px]"}`}
        >
          <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[300px] p-0 bg-transparent border-none shadow-none">
            <div className="h-full p-4">
              <Sidebar className="h-full shadow-2xl" />
            </div>
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-h-screen min-w-0 relative z-10 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-[128px]" : "lg:pl-[328px]"}`}>
          {/* Header */}
          <div className="sticky top-0 z-20 px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
            <Header onMenuClick={() => setMobileMenuOpen(true)} />
          </div>
          
          {/* Scrollable Content */}
          <main className="flex-1 px-4 sm:px-6 pb-6 min-w-0 overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
