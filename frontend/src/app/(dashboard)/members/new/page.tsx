"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Phone,
  MapPin,
  HeartPulse,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { membersApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const memberSchema = z.object({
  // Personal Info
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  
  // Address
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  
  // Emergency Contact
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  
  // Health Info
  bloodGroup: z.string().optional(),
  medicalConditions: z.string().optional(),
  
  // Branch
  branchId: z.string().min(1, "Please select a branch"),
});

type MemberFormData = z.infer<typeof memberSchema>;

const steps = [
  { id: 1, name: "Personal Info", icon: User },
  { id: 2, name: "Contact Details", icon: Phone },
  { id: 3, name: "Address", icon: MapPin },
  { id: 4, name: "Health Info", icon: HeartPulse },
];

export default function AddMemberPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    setValue,
    watch,
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      branchId: "main-branch", // Default branch
    },
  });

  const createMember = useMutation({
    mutationFn: async (data: MemberFormData) => {
      const response = await membersApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Member created successfully!");
      router.push("/members");
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || "Failed to create member";
      toast.error(message);
    },
  });

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate as any);
    
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof MemberFormData)[] => {
    switch (step) {
      case 1:
        return ["firstName", "lastName", "email", "phone", "dateOfBirth", "gender"];
      case 2:
        return ["emergencyName", "emergencyPhone", "emergencyRelation"];
      case 3:
        return ["address", "city", "state", "zipCode"];
      case 4:
        return ["bloodGroup", "medicalConditions", "branchId"];
      default:
        return [];
    }
  };

  const onSubmit = (data: MemberFormData) => {
    createMember.mutate(data);
  };

  const gender = watch("gender");

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"
        >
          <Link href="/members">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Add New Member</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Create a new gym member profile</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between relative px-10">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-200 dark:bg-zinc-800 -z-10 rounded-full" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-orange-500 -z-10 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
        
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/5">
            <div
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 border-2",
                currentStep === step.id
                  ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110"
                  : currentStep > step.id
                  ? "bg-orange-100 dark:bg-orange-500/20 border-orange-500 text-orange-600 dark:text-orange-500"
                  : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500"
              )}
            >
              {currentStep > step.id ? (
                <Check className="h-6 w-6" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
            </div>
            <span className={cn(
              "text-sm font-medium transition-colors",
              currentStep >= step.id ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"
            )}>
              {step.name}
            </span>
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="bg-white/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-2xl">
          <CardContent className="p-8">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-zinc-700 dark:text-zinc-300">First Name *</Label>
                    <Input
                      id="firstName"
                      {...register("firstName")}
                      placeholder="John"
                      className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-orange-500/20"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 dark:text-red-400 text-sm">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-zinc-700 dark:text-zinc-300">Last Name *</Label>
                    <Input
                      id="lastName"
                      {...register("lastName")}
                      placeholder="Doe"
                      className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-orange-500/20"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 dark:text-red-400 text-sm">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="john@example.com"
                    className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-orange-500/20"
                  />
                  {errors.email && (
                    <p className="text-red-500 dark:text-red-400 text-sm">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-zinc-700 dark:text-zinc-300">Phone Number *</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="9876543210"
                    className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-orange-500/20"
                  />
                  {errors.phone && (
                    <p className="text-red-500 dark:text-red-400 text-sm">{errors.phone.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-zinc-700 dark:text-zinc-300">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      {...register("dateOfBirth")}
                      className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:border-orange-500/50 focus:ring-orange-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-700 dark:text-zinc-300">Gender</Label>
                    <Select value={gender} onValueChange={(value) => setValue("gender", value as any)}>
                      <SelectTrigger className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-300 focus:border-orange-500/50 focus:ring-orange-500/20">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-300">
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Emergency Contact */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-lg p-4 mb-4">
                  <p className="text-orange-700 dark:text-orange-200 text-sm">
                    Emergency contact information is optional but highly recommended for member safety.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergencyName" className="text-zinc-700 dark:text-zinc-300">Contact Name</Label>
                  <Input
                    id="emergencyName"
                    {...register("emergencyName")}
                    placeholder="Jane Doe"
                    className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-orange-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone" className="text-zinc-700 dark:text-zinc-300">Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    {...register("emergencyPhone")}
                    placeholder="9876543211"
                    className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-orange-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyRelation" className="text-zinc-700 dark:text-zinc-300">Relationship</Label>
                  <Select onValueChange={(value) => setValue("emergencyRelation", value)}>
                    <SelectTrigger className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-300 focus:border-orange-500/50 focus:ring-orange-500/20">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-300">
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Address */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-zinc-700 dark:text-zinc-300">Street Address</Label>
                  <Textarea
                    id="address"
                    {...register("address")}
                    placeholder="123 Main Street, Apartment 4B"
                    className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 min-h-[100px] focus:border-orange-500/50 focus:ring-orange-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-zinc-700 dark:text-zinc-300">City</Label>
                    <Input
                      id="city"
                      {...register("city")}
                      placeholder="Mumbai"
                      className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-orange-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-zinc-700 dark:text-zinc-300">State</Label>
                    <Input
                      id="state"
                      {...register("state")}
                      placeholder="Maharashtra"
                      className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-orange-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-zinc-700 dark:text-zinc-300">ZIP / Postal Code</Label>
                  <Input
                    id="zipCode"
                    {...register("zipCode")}
                    placeholder="400001"
                    className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-orange-500/20"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Health Info */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label className="text-zinc-700 dark:text-zinc-300">Blood Group</Label>
                  <Select onValueChange={(value) => setValue("bloodGroup", value)}>
                    <SelectTrigger className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-300 focus:border-orange-500/50 focus:ring-orange-500/20">
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-300">
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalConditions" className="text-zinc-700 dark:text-zinc-300">
                    Medical Conditions / Allergies
                  </Label>
                  <Textarea
                    id="medicalConditions"
                    {...register("medicalConditions")}
                    placeholder="Any medical conditions, allergies, or health concerns we should know about..."
                    className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 min-h-[120px] focus:border-orange-500/50 focus:ring-orange-500/20"
                  />
                </div>

                <input type="hidden" {...register("branchId")} />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-10 pt-6 border-t border-zinc-200 dark:border-white/5">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="border-zinc-200 dark:border-white/10 bg-transparent text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={createMember.isPending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 shadow-lg shadow-emerald-500/20"
                >
                  {createMember.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Create Member
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
