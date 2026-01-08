"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Users, Check, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { plansApi } from "@/lib/api";

interface PlanDuration {
  id: string;
  durationMonths: number;
  price: number;
  discountPercent: number;
  registrationFee: number;
}

interface Plan {
  id: string;
  name: string;
  description?: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  color?: string;
  includesClasses: boolean;
  includesPT: boolean;
  classCredits?: number;
  ptSessions?: number;
  durations: PlanDuration[];
  _count: {
    memberships: number;
  };
}

export default function MembershipsPage() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const response = await plansApi.getAll({ includeInactive: true });
      return response.data.data as Plan[];
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getDurationLabel = (months: number) => {
    if (months === 1) return "1 Month";
    if (months === 12) return "1 Year";
    return `${months} Months`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Membership Plans</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your gym's membership plans and pricing
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20" asChild>
          <Link href="/memberships/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Link>
        </Button>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-white/80 dark:bg-zinc-900/40 border-zinc-200 dark:border-white/5 backdrop-blur-xl">
              <CardHeader>
                <Skeleton className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800" />
                <Skeleton className="h-4 w-full bg-zinc-200 dark:bg-zinc-800" />
                <Skeleton className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const lowestPrice = plan.durations.length > 0
              ? Math.min(...plan.durations.map((d) => d.price))
              : 0;

            return (
              <Card
                key={plan.id}
                className={`bg-white/80 dark:bg-zinc-900/40 border-zinc-200 dark:border-white/5 backdrop-blur-xl relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-orange-500/30 ${
                  !plan.isActive ? "opacity-60" : ""
                }`}
              >
                {/* Popular badge */}
                {plan.isPopular && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-orange-500 text-white border-0 shadow-lg shadow-orange-500/20">Popular</Badge>
                  </div>
                )}

                {/* Inactive badge */}
                {!plan.isActive && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">Inactive</Badge>
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    {plan.color && (
                      <div
                        className="w-3 h-3 rounded-full ring-2 ring-white/10"
                        style={{ backgroundColor: plan.color }}
                      />
                    )}
                    <CardTitle className="text-xl text-zinc-900 dark:text-white">{plan.name}</CardTitle>
                  </div>
                  {plan.description && (
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{plan.description}</p>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Starting Price */}
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-semibold">Starting from</p>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">
                      {formatPrice(lowestPrice)}
                      <span className="text-base font-medium text-zinc-500 dark:text-zinc-400 ml-1">/month</span>
                    </p>
                  </div>

                  {/* Duration Options */}
                  <div className="space-y-2">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Duration Options</p>
                    <div className="flex flex-wrap gap-2">
                      {plan.durations.map((duration) => (
                        <Badge
                          key={duration.id}
                          variant="outline"
                          className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-white/10"
                        >
                          {getDurationLabel(duration.durationMonths)} - {formatPrice(duration.price)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Features</p>
                    <ul className="space-y-2">
                      {plan.features.slice(0, 4).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                          <Check className="h-4 w-4 text-emerald-500" />
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 4 && (
                        <li className="text-sm text-zinc-500 dark:text-zinc-400 pl-6">
                          +{plan.features.length - 4} more features
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Includes */}
                  <div className="flex gap-4 pt-2 border-t border-zinc-200 dark:border-white/5">
                    <div className="flex items-center gap-2 text-sm mt-4">
                      {plan.includesClasses ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <X className="h-4 w-4 text-zinc-400" />
                      )}
                      <span className={plan.includesClasses ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-500"}>
                        Classes
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-4">
                      {plan.includesPT ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <X className="h-4 w-4 text-zinc-400" />
                      )}
                      <span className={plan.includesPT ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-500"}>
                        Personal Training
                      </span>
                    </div>
                  </div>

                  {/* Stats & Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-white/5">
                    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{plan._count.memberships} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"
                        asChild
                      >
                        <Link href={`/memberships/${plan.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-500 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-white/80 dark:bg-zinc-900/40 border-zinc-200 dark:border-white/5 backdrop-blur-xl">
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">No membership plans found.</p>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20" asChild>
              <Link href="/memberships/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Plan
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
