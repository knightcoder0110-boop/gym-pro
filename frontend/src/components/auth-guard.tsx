"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { authApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user, setUser, setLoading, logout } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        router.push("/login");
        return;
      }

      // If we have a token but no user data, fetch user info
      if (!user) {
        try {
          const response = await authApi.me();
          setUser(response.data.data);
        } catch (error) {
          // Token is invalid, logout and redirect
          logout();
          router.push("/login");
          return;
        }
      }

      setIsChecking(false);
      setLoading(false);
    };

    checkAuth();
  }, [router, user, setUser, setLoading, logout]);

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !user) {
    return null;
  }

  return <>{children}</>;
}
