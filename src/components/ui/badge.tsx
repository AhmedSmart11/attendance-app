'use client';

import React from 'react';
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 focus:ring-primary",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary",
        destructive:
          "border-transparent bg-destructive text-white hover:bg-destructive/80 focus:ring-destructive",
        outline:
          "text-foreground border-border bg-transparent hover:bg-muted hover:text-foreground focus:ring-primary",
        success:
          "border-transparent bg-emerald-100 text-emerald-800",
        warning:
          "border-transparent bg-amber-100 text-amber-800",
        error:
          "border-transparent bg-red-100 text-red-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant = "default", ...props }: VariantProps<typeof badgeVariants> & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge }
