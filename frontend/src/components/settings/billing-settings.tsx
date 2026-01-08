import { motion } from "framer-motion";
import { Zap, Check, CreditCard, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function BillingSettings() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 w-full"
    >
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {/* Current Plan Card */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 shadow-sm relative overflow-hidden w-full">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <CardContent className="p-4 md:p-6 relative">
            <div className="flex justify-between items-start mb-4 md:mb-6">
              <div className="p-2 md:p-3 bg-orange-100 dark:bg-orange-500/10 rounded-xl">
                <Zap className="h-5 w-5 md:h-6 md:w-6 text-orange-600 dark:text-orange-500" />
              </div>
              <Badge className="bg-orange-500 text-white hover:bg-orange-600 border-none text-xs">Active</Badge>
            </div>
            
            <div className="space-y-2 mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">Pro Plan</h3>
              <div className="flex items-baseline gap-1 text-zinc-900 dark:text-white">
                <span className="text-2xl md:text-3xl font-bold">$29.99</span>
                <span className="text-sm md:text-base text-zinc-500 dark:text-zinc-400 font-medium">/month</span>
              </div>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">
                Everything you need to run your gym efficiently.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Check className="h-4 w-4 text-green-500" />
                <span>Unlimited Members</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Check className="h-4 w-4 text-green-500" />
                <span>Advanced Analytics</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Check className="h-4 w-4 text-green-500" />
                <span>Priority Support</span>
              </div>
            </div>

            <Button className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100">
              Manage Subscription
            </Button>
          </CardContent>
        </Card>

        {/* Payment & History */}
        <div className="space-y-4 md:space-y-6 w-full">
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 shadow-sm w-full">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm md:text-base text-zinc-900 dark:text-white">Payment Method</h3>
                <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 text-xs md:text-sm">
                  Update
                </Button>
              </div>
              <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 border border-zinc-100 dark:border-white/5 rounded-xl bg-zinc-50/50 dark:bg-white/5">
                <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm shrink-0">
                  <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-zinc-700 dark:text-zinc-300" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-xs md:text-sm text-zinc-900 dark:text-white">•••• •••• •••• 4242</p>
                  <p className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400">Expires 12/2028</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 shadow-sm flex-1 w-full">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm md:text-base text-zinc-900 dark:text-white">Next Invoice</h3>
                <span className="text-[10px] md:text-xs text-zinc-500 bg-zinc-100 dark:bg-white/10 px-2 py-1 rounded-full">Auto-pay on</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-full shrink-0">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm md:text-base text-zinc-900 dark:text-white">February 1, 2026</p>
                  <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">Amount: $29.99</p>
                </div>
              </div>
              <div className="mt-4 md:mt-6">
                <Button variant="outline" className="w-full border-zinc-200 dark:border-white/10 text-xs md:text-sm">
                  View Billing History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
