"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { plansApi } from "@/lib/api";

const planSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  features: z.array(z.object({ value: z.string().min(1, "Feature cannot be empty") })),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  color: z.string().optional(),
  includesClasses: z.boolean().default(false),
  includesPT: z.boolean().default(false),
  classCredits: z.coerce.number().min(0).optional(),
  ptSessions: z.coerce.number().min(0).optional(),
  durations: z.array(
    z.object({
      id: z.string().optional(),
      durationMonths: z.coerce.number().min(1, "Duration must be at least 1 month"),
      price: z.coerce.number().min(0, "Price must be positive"),
      discountPercent: z.coerce.number().min(0).max(100).default(0),
      registrationFee: z.coerce.number().min(0).default(0),
    })
  ).min(1, "At least one duration option is required"),
});

type PlanFormValues = z.infer<typeof planSchema>;

interface PlanFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export function PlanForm({ initialData, isEditing = false }: PlanFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transform initial data features from string[] to object array for useFieldArray
  const defaultValues: Partial<PlanFormValues> = initialData
    ? {
        name: initialData.name,
        description: initialData.description || "",
        features: initialData.features?.map((f: string) => ({ value: f })) || [],
        isPopular: initialData.isPopular,
        isActive: initialData.isActive,
        color: initialData.color || "#f97316",
        includesClasses: initialData.includesClasses,
        includesPT: initialData.includesPT,
        classCredits: initialData.classCredits || 0,
        ptSessions: initialData.ptSessions || 0,
        durations: initialData.durations?.map((d: any) => ({
          id: d.id,
          durationMonths: d.durationMonths,
          price: d.price,
          discountPercent: d.discountPercent || 0,
          registrationFee: d.registrationFee || 0,
        })) || [],
      }
    : {
        name: "",
        description: "",
        features: [{ value: "Gym Access" }, { value: "Locker Access" }],
        isPopular: false,
        isActive: true,
        color: "#f97316", // Default orange
        includesClasses: false,
        includesPT: false,
        classCredits: 0,
        ptSessions: 0,
        durations: [
          { durationMonths: 1, price: 1000, discountPercent: 0, registrationFee: 0 },
        ],
      };

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema) as any,
    defaultValues,
    mode: "onChange",
  });

  const { fields: featureFields, append: appendFeature, remove: removeFeature } = useFieldArray({
    control: form.control,
    name: "features",
  });

  const { fields: durationFields, append: appendDuration, remove: removeDuration } = useFieldArray({
    control: form.control,
    name: "durations",
  });

  const onSubmit = async (data: PlanFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Transform features back to string[]
      const formattedData = {
        ...data,
        features: data.features.map((f) => f.value),
        // Ensure numbers are numbers and handle nulls
        classCredits: data.includesClasses ? Number(data.classCredits || 0) : null,
        ptSessions: data.includesPT ? Number(data.ptSessions || 0) : null,
      };

      if (isEditing && initialData?.id) {
        await plansApi.update(initialData.id, formattedData);
        toast.success("Plan updated successfully");
      } else {
        await plansApi.create(formattedData);
        toast.success("Plan created successfully");
      }

      router.push("/memberships");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(isEditing ? "Failed to update plan" : "Failed to create plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const predefinedColors = [
    "#f97316", // Orange
    "#ef4444", // Red
    "#84cc16", // Lime
    "#10b981", // Emerald
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
    "#8b5cf6", // Violet
    "#d946ef", // Fuchsia
    "#6b7280", // Gray
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left Column: Basic Info & Features */}
          <div className="space-y-8">
            <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-zinc-200 dark:border-white/5">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>General details about the membership plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Gold Membership" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of what this plan offers..." 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                   <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Accent Color</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {predefinedColors.map((color) => (
                            <div
                              key={color}
                              className={`w-8 h-8 rounded-full cursor-pointer transition-all ${
                                field.value === color ? "ring-2 ring-offset-2 ring-zinc-900 dark:ring-white scale-110" : ""
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => field.onChange(color)}
                            />
                          ))}
                        </div>
                        <FormControl>
                          <div className="flex items-center gap-2 mt-2">
                            <Input type="color" className="w-12 h-8 p-1" {...field} />
                            <span className="text-xs text-muted-foreground uppercase">{field.value}</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center gap-8 pt-4">
                  <FormField
                    control={form.control}
                    name="isPopular"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                        <div className="space-y-0.5">
                          <FormLabel>Popular Plan</FormLabel>
                          <FormDescription>Mark as recommended</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm flex-1">
                        <div className="space-y-0.5">
                          <FormLabel>Active Status</FormLabel>
                          <FormDescription>Visible to members</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-zinc-200 dark:border-white/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Features</CardTitle>
                  <CardDescription>What's included in this plan?</CardDescription>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => appendFeature({ value: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {featureFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField
                      control={form.control}
                      name={`features.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="e.g. Free Towel Service" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-red-500"
                      onClick={() => removeFeature(index)}
                      disabled={featureFields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Pricing & Limits */}
          <div className="space-y-8">
            <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-zinc-200 dark:border-white/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pricing & Duration</CardTitle>
                  <CardDescription>Define cost for different time periods</CardDescription>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => appendDuration({ durationMonths: 1, price: 0, discountPercent: 0, registrationFee: 0 })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {durationFields.map((field, index) => (
                  <div key={field.id} className="relative p-4 border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
                     <div className="absolute top-2 right-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => removeDuration(index)}
                        disabled={durationFields.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <FormField
                        control={form.control}
                        name={`durations.${index}.durationMonths`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (Months)</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`durations.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Price (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <FormField
                        control={form.control}
                        name={`durations.${index}.registrationFee`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reg. Fee (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name={`durations.${index}.discountPercent`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount (%)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" max="100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border-zinc-200 dark:border-white/5">
              <CardHeader>
                <CardTitle>Credits & Limits</CardTitle>
                <CardDescription>Allowances for classes and PT sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Classes Toggle & Input */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="includesClasses"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Include Classes</FormLabel>
                          <FormDescription>Access to group classes</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("includesClasses") && (
                     <FormField
                      control={form.control}
                      name="classCredits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class Credits (per month)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormDescription>Set 0 for unlimited access</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <Separator />

                {/* PT Toggle & Input */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="includesPT"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Include Personal Training</FormLabel>
                          <FormDescription>Access to PT sessions</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("includesPT") && (
                     <FormField
                      control={form.control}
                      name="ptSessions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PT Sessions (Total)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-orange-500 hover:bg-orange-600 text-white min-w-[150px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{isEditing ? "Update Plan" : "Create Plan"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
