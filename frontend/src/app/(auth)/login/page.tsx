"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("Please enter email and password");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await authApi.login(formData.email, formData.password);
      const { user, accessToken, refreshToken } = response.data.data;
      
      // Store auth data using zustand store
      login(user, accessToken, refreshToken);
      
      toast.success(`Welcome back, ${user.firstName}!`);
      router.push("/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.error?.message || "Invalid credentials";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-background relative overflow-hidden p-4 selection:bg-orange-500/30">
      {/* Background Patterns */}
      <div className="absolute inset-0 grid-pattern opacity-[0.05] dark:opacity-[0.15] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-[128px] pointer-events-none" />

      {/* Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 z-10"
      >
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-amber-600 shadow-xl shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
            <Zap className="h-8 w-8 text-white fill-white" />
          </div>
        </Link>
      </motion.div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md bg-white/80 dark:bg-zinc-900/40 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Log in to your JERAI dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email or username
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="w-full h-12 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                className="w-full h-12 px-4 pr-12 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={formData.remember}
                onChange={(e) =>
                  setFormData({ ...formData, remember: e.target.checked })
                }
                className="w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-orange-500 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors">
                Remember me
              </label>
            </div>
            <Link
              href="/forgot-password"
              className="text-sm text-orange-600 dark:text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 transition-colors font-medium"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-linear-to-r from-orange-500 to-amber-600 text-white font-bold text-base hover:from-orange-600 hover:to-amber-700 hover:scale-[1.02] active:scale-100 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="mt-8 text-center text-zinc-500 dark:text-zinc-500 text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-zinc-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-500 font-medium transition-colors">
            Create an account
          </Link>
        </p>
      </motion.div>

      {/* Footer Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-12 flex items-center gap-8 text-center relative z-10"
      >
        <div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-500">1000+</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider font-medium">Active Members</p>
        </div>
        <div className="h-8 w-px bg-zinc-300 dark:bg-white/10" />
        <div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-500">50+</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider font-medium">Daily Classes</p>
        </div>
        <div className="h-8 w-px bg-zinc-300 dark:bg-white/10" />
        <div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-500">98%</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 uppercase tracking-wider font-medium">Satisfaction</p>
        </div>
      </motion.div>
    </div>
  );
}
