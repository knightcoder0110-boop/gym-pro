"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlanForm } from "@/components/memberships/plan-form";
import { plansApi } from "@/lib/api";

interface EditPlanPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPlanPage({ params }: EditPlanPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [plan, setPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const response = await plansApi.getById(id);
        setPlan(response.data.data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load plan details");
        router.push("/memberships");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPlan();
    }
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/memberships">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Edit Plan</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Update details for {plan.name}
          </p>
        </div>
      </div>

      <PlanForm initialData={plan} isEditing />
    </div>
  );
}
