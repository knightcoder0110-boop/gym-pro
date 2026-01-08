"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlanForm } from "@/components/memberships/plan-form";

export default function CreatePlanPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/memberships">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Create Plan</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Add a new membership plan to your gym
          </p>
        </div>
      </div>

      <PlanForm />
    </div>
  );
}
