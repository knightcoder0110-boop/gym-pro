"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Zap, 
  Users, 
  Calendar, 
  TrendingUp, 
  Shield, 
  Smartphone,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Users,
      title: "Member Management",
      description: "Effortlessly manage member profiles, memberships, and attendance tracking"
    },
    {
      icon: Calendar,
      title: "Class Scheduling",
      description: "Schedule classes, manage bookings, and track trainer availability"
    },
    {
      icon: TrendingUp,
      title: "Analytics & Reports",
      description: "Gain insights with comprehensive analytics and revenue tracking"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with automatic backups and data protection"
    }
  ];

  const benefits = [
    "Automated membership renewals",
    "Real-time attendance tracking",
    "Payment processing & invoicing",
    "Email notifications & reminders",
    "Mobile-responsive dashboard",
    "Lead management & conversion"
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20">
                <Zap className="h-5 w-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold text-zinc-900 dark:text-white">JERAI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 text-white text-sm font-semibold hover:from-orange-600 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/25"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 grid-pattern opacity-[0.05] dark:opacity-[0.15] pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/10 rounded-full blur-[128px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20 mb-6">
                <Smartphone className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                <span className="text-sm font-medium text-orange-600 dark:text-orange-500">
                  Modern Gym Management Platform
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-900 dark:text-white mb-6 leading-tight"
            >
              Elevate Your Gym
              <br />
              <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">
                Management Experience
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto"
            >
              The complete platform built for modern fitness businesses. Streamline operations, 
              boost member engagement, and grow your revenue—all in one place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/login"
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-lg hover:from-orange-600 hover:to-amber-700 hover:scale-105 transition-all shadow-2xl shadow-orange-500/25 flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-white/10"
              >
                View Demo
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-16 flex items-center justify-center gap-8 sm:gap-12"
            >
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-orange-600 dark:text-orange-500">1000+</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 uppercase tracking-wider font-medium">Active Members</p>
              </div>
              <div className="h-12 w-px bg-zinc-300 dark:bg-white/10" />
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-orange-600 dark:text-orange-500">50+</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 uppercase tracking-wider font-medium">Daily Classes</p>
              </div>
              <div className="h-12 w-px bg-zinc-300 dark:bg-white/10" />
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-orange-600 dark:text-orange-500">98%</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-500 uppercase tracking-wider font-medium">Satisfaction</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Powerful features designed to help you manage your gym efficiently and grow your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:border-orange-500/50 transition-all group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20 mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-6">
                Why Choose JERAI?
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
                Built by gym owners, for gym owners. We understand the challenges you face 
                and have created the perfect solution to help you thrive.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="h-6 w-6 text-orange-500 flex-shrink-0" />
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                      {benefit}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-1">
                <div className="w-full h-full rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
                  <Zap className="h-32 w-32 text-orange-500" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-500 to-amber-600 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Gym?
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Join hundreds of gym owners who have already elevated their business with JERAI
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-8 py-4 rounded-xl bg-white text-orange-600 font-bold text-lg hover:bg-zinc-100 transition-all shadow-2xl"
              >
                Get Started Now
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 rounded-xl bg-transparent text-white font-bold text-lg hover:bg-white/10 transition-all border-2 border-white"
              >
                Contact Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20">
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white">JERAI</span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-500 text-sm">
            © 2026 JERAI. All rights reserved. Built for modern fitness businesses.
          </p>
        </div>
      </footer>
    </div>
  );
}
