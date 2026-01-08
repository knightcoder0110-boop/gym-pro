"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-white hover:bg-orange-500/10 dark:hover:bg-white/10"
        >
          <Sun className="h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white/90 dark:bg-zinc-900/90 border-zinc-200 dark:border-white/10 backdrop-blur-2xl rounded-xl">
        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer focus:bg-orange-500/10 focus:text-orange-600 dark:focus:bg-white/5 dark:focus:text-white">
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer focus:bg-orange-500/10 focus:text-orange-600 dark:focus:bg-white/5 dark:focus:text-white">
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer focus:bg-orange-500/10 focus:text-orange-600 dark:focus:bg-white/5 dark:focus:text-white">
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
