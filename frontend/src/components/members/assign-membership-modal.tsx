"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { plansApi, membershipsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  description?: string;
  color?: string;
  features: string[];
  durations: Array<{
    id: string;
    durationMonths: number;
    price: number;
    discountPercent: number;
    registrationFee: number;
  }>;
}

interface AssignMembershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
}

export function AssignMembershipModal({
  open,
  onOpenChange,
  memberId,
  memberName,
}: AssignMembershipModalProps) {
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedDurationId, setSelectedDurationId] = useState<string>("");

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const response = await plansApi.getAll();
      return response.data.data as Plan[];
    },
    enabled: open,
  });

  const selectedPlan = plans?.find((p) => p.id === selectedPlanId);
  const selectedDuration = selectedPlan?.durations.find(
    (d) => d.id === selectedDurationId
  );

  const assignMembership = useMutation({
    mutationFn: async () => {
      const response = await membershipsApi.create({
        memberId,
        planId: selectedPlanId,
        durationId: selectedDurationId,
        startDate: new Date().toISOString(),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member", memberId] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Membership assigned successfully!");
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error?.message || "Failed to assign membership";
      toast.error(message);
    },
  });

  const resetForm = () => {
    setSelectedPlanId("");
    setSelectedDurationId("");
  };

  const handleSubmit = () => {
    if (!selectedPlanId || !selectedDurationId) {
      toast.error("Please select a plan and duration");
      return;
    }
    assignMembership.mutate();
  };

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

  const calculateTotal = () => {
    if (!selectedDuration) return 0;
    return selectedDuration.price + selectedDuration.registrationFee;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Assign Membership</DialogTitle>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Assign a membership plan to {memberName}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Plan Selection */}
          <div className="space-y-2">
            <Label className="text-zinc-700 dark:text-zinc-300">Select Plan</Label>
            {plansLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : (
              <div className="grid gap-3">
                {plans?.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      setSelectedDurationId("");
                    }}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all",
                      selectedPlanId === plan.id
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10"
                        : "border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/50 hover:border-orange-500/50 dark:hover:border-orange-500/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {plan.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: plan.color }}
                          />
                        )}
                        <span className="font-medium text-zinc-900 dark:text-white">{plan.name}</span>
                      </div>
                      {selectedPlanId === plan.id && (
                        <Check className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                    {plan.description && (
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                        {plan.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Duration Selection */}
          {selectedPlan && (
            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300">Select Duration</Label>
              <Select
                value={selectedDurationId}
                onValueChange={setSelectedDurationId}
              >
                <SelectTrigger className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white">
                  <SelectValue placeholder="Choose duration" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10">
                  {selectedPlan.durations.map((duration) => (
                    <SelectItem
                      key={duration.id}
                      value={duration.id}
                      className="text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5 focus:bg-zinc-100 dark:focus:bg-white/5"
                    >
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span>{getDurationLabel(duration.durationMonths)}</span>
                        <span className="text-orange-600 dark:text-orange-500 font-medium">
                          {formatPrice(duration.price)}
                        </span>
                        {duration.discountPercent > 0 && (
                          <Badge className="bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 text-xs border-orange-200 dark:border-orange-500/20">
                            {duration.discountPercent}% off
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Price Summary */}
          {selectedDuration && (
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-4 space-y-2 border border-zinc-200 dark:border-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Plan Price</span>
                <span className="text-zinc-900 dark:text-white font-medium">
                  {formatPrice(selectedDuration.price)}
                </span>
              </div>
              {selectedDuration.registrationFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Registration Fee</span>
                  <span className="text-zinc-900 dark:text-white font-medium">
                    {formatPrice(selectedDuration.registrationFee)}
                  </span>
                </div>
              )}
              <div className="border-t border-zinc-200 dark:border-white/10 pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-zinc-900 dark:text-white">Total</span>
                  <span className="text-orange-600 dark:text-orange-500">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-white/10">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-200 dark:border-white/10 bg-transparent text-zinc-700 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedPlanId || !selectedDurationId || assignMembership.isPending}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            {assignMembership.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Membership"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
