import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "error" | "outline";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      secondary: "bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300",
      success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      outline: "border border-neutral-200 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
