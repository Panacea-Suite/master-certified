import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const neuButtonVariants = cva(
  "neu-button inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-input-focus disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-foreground",
        primary: "bg-primary text-primary-foreground shadow-[var(--neu-raised)] hover:bg-primary/90 active:shadow-[var(--neu-pressed)]",
        success: "bg-success text-success-foreground shadow-[var(--neu-raised)] hover:bg-success/90",
        warning: "bg-warning text-warning-foreground shadow-[var(--neu-raised)] hover:bg-warning/90",
        destructive: "bg-destructive text-destructive-foreground shadow-[var(--neu-raised)] hover:bg-destructive/90",
        ghost: "hover:bg-surface-light active:bg-card-pressed",
        flat: "shadow-[var(--neu-flat)]"
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface NeuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neuButtonVariants> {
  asChild?: boolean
}

const NeuButton = React.forwardRef<HTMLButtonElement, NeuButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(neuButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
NeuButton.displayName = "NeuButton"

export { NeuButton, neuButtonVariants }