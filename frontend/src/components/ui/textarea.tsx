import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20 focus-visible:border-orange-500/50 disabled:cursor-not-allowed disabled:opacity-50 text-zinc-900 dark:text-white",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
