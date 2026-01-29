import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "error" | "outline";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      secondary: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
      success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      outline: "border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300",
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
