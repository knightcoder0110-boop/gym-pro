"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentsApi, membersApi, plansApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Receipt,
  Plus,
  Search,
  Filter,
  Loader2,
  IndianRupee,
  Banknote,
  Wallet,
  Building,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { StatsRail, StatItem } from "@/components/dashboard/stats-rail";

interface Payment {
  id: string;
  invoiceNumber: string;
  memberId: string;
  amount: number;
  subtotal: number;
  discount: number;
  tax: number;
  type: string;
  paymentMethod: string;
  status: string;
  paymentDate: string;
  notes?: string;
  member: {
    id: string;
    memberId: string;
    firstName: string;
    lastName: string;
  };
  membership?: {
    id: string;
    plan: { name: string };
  };
  collectedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  byMethod: Array<{ paymentMethod: string; _sum: { amount: number }; _count: number }>;
  byType: Array<{ type: string; _sum: { amount: number }; _count: number }>;
  recentPayments: Payment[];
}

interface Member {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

const paymentMethods = [
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "UPI", label: "UPI", icon: Wallet },
  { value: "NET_BANKING", label: "Net Banking", icon: Building },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Building },
];

const paymentTypes = [
  { value: "MEMBERSHIP", label: "Membership" },
  { value: "RENEWAL", label: "Renewal" },
  { value: "REGISTRATION", label: "Registration" },
  { value: "PT_SESSION", label: "PT Session" },
  { value: "ADDON", label: "Add-on" },
  { value: "OTHER", label: "Other" },
];

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [showRefund, setShowRefund] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    type: "MEMBERSHIP",
    paymentMethod: "CASH",
    notes: "",
    discount: "0",
    tax: "18",
  });

  // Refund form state
  const [refundForm, setRefundForm] = useState({
    reason: "",
    refundAmount: "",
  });

  // Fetch payments
  const { data: paymentsData, isLoading: loadingPayments, refetch } = useQuery({
    queryKey: ["payments", filterStatus, filterType],
    queryFn: async () => {
      const params: any = { limit: 50 };
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterType !== "all") params.type = filterType;
      const res = await paymentsApi.getAll(params);
      return res.data;
    },
  });

  // Fetch payment stats
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["payments", "stats"],
    queryFn: async () => {
      const res = await paymentsApi.getStats();
      return res.data.data as PaymentStats;
    },
  });

  // Search members for new payment
  const { data: memberResults, isLoading: searchingMembers } = useQuery({
    queryKey: ["members", "search", memberSearch],
    queryFn: async () => {
      if (memberSearch.length < 2) return [];
      const res = await membersApi.getAll({ search: memberSearch, limit: 10 });
      return res.data.data.members as Member[];
    },
    enabled: memberSearch.length >= 2,
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (data: any) => paymentsApi.create(data),
    onSuccess: () => {
      toast.success("Payment recorded successfully!");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setShowNewPayment(false);
      resetPaymentForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Failed to record payment");
    },
  });

  // Refund mutation
  const refundMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => paymentsApi.refund(id, data),
    onSuccess: () => {
      toast.success("Payment refunded successfully!");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setShowRefund(null);
      setRefundForm({ reason: "", refundAmount: "" });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Failed to process refund");
    },
  });

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: "",
      type: "MEMBERSHIP",
      paymentMethod: "CASH",
      notes: "",
      discount: "0",
      tax: "18",
    });
    setSelectedMember(null);
    setMemberSearch("");
  };

  const handleCreatePayment = () => {
    if (!selectedMember) {
      toast.error("Please select a member");
      return;
    }
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    createPaymentMutation.mutate({
      memberId: selectedMember.id,
      amount: parseFloat(paymentForm.amount),
      type: paymentForm.type,
      paymentMethod: paymentForm.paymentMethod,
      notes: paymentForm.notes,
      discount: parseFloat(paymentForm.discount) || 0,
      tax: parseFloat(paymentForm.tax) || 0,
    });
  };

  const handleRefund = () => {
    if (!showRefund) return;
    refundMutation.mutate({
      id: showRefund.id,
      data: {
        reason: refundForm.reason,
        refundAmount: refundForm.refundAmount ? parseFloat(refundForm.refundAmount) : undefined,
      },
    });
  };

  const calculateTotal = () => {
    const amount = parseFloat(paymentForm.amount) || 0;
    const discount = (amount * (parseFloat(paymentForm.discount) || 0)) / 100;
    const taxable = amount - discount;
    const tax = (taxable * (parseFloat(paymentForm.tax) || 0)) / 100;
    return taxable + tax;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
            <RotateCcw className="mr-1 h-3 w-3" />
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getMethodIcon = (method: string) => {
    const found = paymentMethods.find((m) => m.value === method);
    if (found) {
      const Icon = found.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <CreditCard className="h-4 w-4" />;
  };

  const payments = paymentsData?.data || [];
  const filteredPayments = payments.filter((p: Payment) =>
    searchQuery
      ? p.member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Payments</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage payments and transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm" onClick={() => setShowNewPayment(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">New Payment</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsRail
        stats={[
          {
            title: "Total Revenue",
            value: formatCurrency(statsData?.totalRevenue || 0),
            icon: IndianRupee,
            color: "orange",
            description: "All payments",
          },
          {
            title: "Total Transactions",
            value: statsData?.totalTransactions?.toString() || "0",
            icon: Receipt,
            color: "emerald",
            description: "Payment count",
          },
          {
            title: "Cash Payments",
            value: formatCurrency(
              statsData?.byMethod.find((m) => m.paymentMethod === "CASH")?._sum.amount || 0
            ),
            icon: Banknote,
            color: "blue",
            description: "Cash received",
          },
          {
            title: "Digital Payments",
            value: formatCurrency(
              (statsData?.byMethod.find((m) => m.paymentMethod === "UPI")?._sum.amount || 0) +
                (statsData?.byMethod.find((m) => m.paymentMethod === "CARD")?._sum.amount || 0)
            ),
            icon: Wallet,
            color: "purple",
            description: "UPI & Card",
          },
        ]}
        loading={loadingStats}
      />

      {/* Filters & Search */}
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by member name or invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {paymentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Member</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Type</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Method</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium hidden lg:table-cell">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingPayments ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment: Payment) => (
                    <tr key={payment.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3">
                        <span className="font-mono text-sm">{payment.invoiceNumber}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {payment.member.firstName[0]}
                              {payment.member.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="hidden sm:block">
                            <p className="font-medium text-sm">
                              {payment.member.firstName} {payment.member.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{payment.member.memberId}</p>
                          </div>
                          <span className="sm:hidden text-sm font-medium">
                            {payment.member.firstName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">
                          {payment.type}
                        </Badge>
                      </td>
                      <td className="py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          {getMethodIcon(payment.paymentMethod)}
                          <span className="text-sm">
                            {paymentMethods.find((m) => m.value === payment.paymentMethod)?.label ||
                              payment.paymentMethod}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-sm">{formatCurrency(payment.amount)}</span>
                      </td>
                      <td className="py-3 hidden lg:table-cell text-sm text-muted-foreground">
                        {format(new Date(payment.paymentDate), "dd MMM yyyy")}
                      </td>
                      <td className="py-3">{getStatusBadge(payment.status)}</td>
                      <td className="py-3 text-right">
                        {payment.status === "COMPLETED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowRefund(payment)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <RotateCcw className="h-4 w-4" />
                            <span className="hidden sm:inline ml-1">Refund</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* New Payment Modal */}
      <Dialog open={showNewPayment} onOpenChange={setShowNewPayment}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record New Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Member Search */}
            <div className="space-y-2">
              <Label>Member</Label>
              {selectedMember ? (
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedMember.firstName[0]}
                        {selectedMember.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedMember.firstName} {selectedMember.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{selectedMember.memberId}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>
                    Change
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search member..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {memberSearch.length >= 2 && (
                    <div className="max-h-[200px] overflow-y-auto rounded-lg border border-border">
                      {searchingMembers ? (
                        <div className="p-4 text-center">
                          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                        </div>
                      ) : memberResults && memberResults.length > 0 ? (
                        <div className="divide-y divide-border">
                          {memberResults.map((member) => (
                            <button
                              key={member.id}
                              className="flex w-full items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                              onClick={() => {
                                setSelectedMember(member);
                                setMemberSearch("");
                              }}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {member.firstName[0]}
                                  {member.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">
                                  {member.firstName} {member.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">{member.memberId}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="p-4 text-center text-muted-foreground">No members found</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                placeholder="0"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              />
            </div>

            {/* Type & Method */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select
                  value={paymentForm.type}
                  onValueChange={(v) => setPaymentForm({ ...paymentForm, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select
                  value={paymentForm.paymentMethod}
                  onValueChange={(v) => setPaymentForm({ ...paymentForm, paymentMethod: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Discount & Tax */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={paymentForm.discount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, discount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tax (%)</Label>
                <Input
                  type="number"
                  placeholder="18"
                  value={paymentForm.tax}
                  onChange={(e) => setPaymentForm({ ...paymentForm, tax: e.target.value })}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes..."
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              />
            </div>

            {/* Total */}
            {paymentForm.amount && (
              <div className="rounded-lg bg-muted p-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(parseFloat(paymentForm.amount) || 0)}</span>
                </div>
                {parseFloat(paymentForm.discount) > 0 && (
                  <div className="flex justify-between text-sm text-green-500">
                    <span>Discount ({paymentForm.discount}%)</span>
                    <span>
                      -{formatCurrency((parseFloat(paymentForm.amount) * parseFloat(paymentForm.discount)) / 100)}
                    </span>
                  </div>
                )}
                {parseFloat(paymentForm.tax) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax ({paymentForm.tax}%)</span>
                    <span>
                      +
                      {formatCurrency(
                        ((parseFloat(paymentForm.amount) -
                          (parseFloat(paymentForm.amount) * parseFloat(paymentForm.discount)) / 100) *
                          parseFloat(paymentForm.tax)) /
                          100
                      )}
                    </span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPayment(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePayment} disabled={createPaymentMutation.isPending}>
              {createPaymentMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Modal */}
      <Dialog open={!!showRefund} onOpenChange={() => setShowRefund(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {showRefund && (
              <>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Original Payment</p>
                  <p className="font-mono text-lg">{showRefund.invoiceNumber}</p>
                  <p className="text-sm">
                    {showRefund.member.firstName} {showRefund.member.lastName}
                  </p>
                  <p className="mt-2 text-xl font-bold text-primary">
                    {formatCurrency(showRefund.amount)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Refund Amount (₹)</Label>
                  <Input
                    type="number"
                    placeholder={showRefund.amount.toString()}
                    value={refundForm.refundAmount}
                    onChange={(e) => setRefundForm({ ...refundForm, refundAmount: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for full refund
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea
                    placeholder="Reason for refund..."
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefund(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={refundMutation.isPending}
            >
              {refundMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
