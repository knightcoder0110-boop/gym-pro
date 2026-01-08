import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Palette, Moon, Sun, Monitor, Check, Smartphone, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-lg">
              <Palette className="h-5 w-5 text-purple-600 dark:text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-xl text-zinc-900 dark:text-white">
                Appearance
              </CardTitle>
              <CardDescription className="mt-1">
                Customize how the application looks and feels.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="space-y-4">
            <Label className="text-base font-medium text-zinc-900 dark:text-white">Interface Theme</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "group relative flex flex-col items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 outline-none focus:ring-2 focus:ring-orange-500/20",
                  theme === "light"
                    ? "border-orange-500 bg-orange-50/50 dark:bg-orange-500/10"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                )}
              >
                <div className={cn(
                  "w-full aspect-4/3 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden relative shadow-inner",
                  theme === "light" && "ring-2 ring-orange-500/20"
                )}>
                  <div className="absolute inset-0 bg-white m-3 rounded shadow-sm">
                    <div className="h-2 w-1/3 bg-zinc-100 rounded mb-2 m-2" />
                    <div className="space-y-1 m-2">
                      <div className="h-1.5 w-full bg-zinc-50 rounded" />
                      <div className="h-1.5 w-2/3 bg-zinc-50 rounded" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-white border border-zinc-200 shadow-sm">
                      <Sun className="h-4 w-4 text-orange-500" />
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-white">Light</span>
                  </div>
                  {theme === "light" && (
                    <div className="h-5 w-5 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-sm">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "group relative flex flex-col items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 outline-none focus:ring-2 focus:ring-orange-500/20",
                  theme === "dark"
                    ? "border-orange-500 bg-orange-50/50 dark:bg-orange-500/10"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                )}
              >
                <div className={cn(
                  "w-full aspect-[4/3] rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden relative shadow-inner",
                  theme === "dark" && "ring-2 ring-orange-500/20"
                )}>
                  <div className="absolute inset-0 bg-zinc-800 m-3 rounded shadow-sm border border-white/5">
                    <div className="h-2 w-1/3 bg-zinc-700 rounded mb-2 m-2" />
                    <div className="space-y-1 m-2">
                      <div className="h-1.5 w-full bg-zinc-700/50 rounded" />
                      <div className="h-1.5 w-2/3 bg-zinc-700/50 rounded" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-zinc-800 border border-zinc-700 shadow-sm">
                      <Moon className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-white">Dark</span>
                  </div>
                  {theme === "dark" && (
                    <div className="h-5 w-5 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-sm">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() => setTheme("system")}
                className={cn(
                  "group relative flex flex-col items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 outline-none focus:ring-2 focus:ring-orange-500/20",
                  theme === "system"
                    ? "border-orange-500 bg-orange-50/50 dark:bg-orange-500/10"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                )}
              >
                <div className={cn(
                  "w-full aspect-4/3 rounded-lg bg-linear-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 border border-zinc-200 dark:border-zinc-800 overflow-hidden relative shadow-inner flex items-center justify-center",
                  theme === "system" && "ring-2 ring-orange-500/20"
                )}>
                  <Laptop className="h-8 w-8 text-zinc-400" />
                </div>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                      <Monitor className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-white">System</span>
                  </div>
                  {theme === "system" && (
                    <div className="h-5 w-5 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-sm">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Accent Color Selection (Mockup for now) */}
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-white/5">
            <Label className="text-base font-medium text-zinc-900 dark:text-white">Accent Color</Label>
            <div className="flex flex-wrap gap-3">
              {[
                { name: "Orange", class: "bg-orange-500", ring: "ring-orange-500" },
                { name: "Blue", class: "bg-blue-500", ring: "ring-blue-500" },
                { name: "Green", class: "bg-green-500", ring: "ring-green-500" },
                { name: "Purple", class: "bg-purple-500", ring: "ring-purple-500" },
                { name: "Pink", class: "bg-pink-500", ring: "ring-pink-500" },
              ].map((color) => (
                <button
                  key={color.name}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-900",
                    color.class,
                    color.name === "Orange" ? "ring-2 ring-offset-2 ring-orange-500 dark:ring-offset-zinc-900" : ""
                  )}
                  aria-label={`Select ${color.name} theme`}
                >
                  {color.name === "Orange" && <Check className="w-5 h-5 text-white" />}
                </button>
              ))}
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Select your preferred accent color for buttons and highlights.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
