import * as React from "react"
import { cn } from "@/lib/utils"

export interface NeuInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const NeuInput = React.forwardRef<HTMLInputElement, NeuInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "neu-input flex h-12 w-full px-4 py-3 text-sm text-foreground placeholder:text-foreground/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
NeuInput.displayName = "NeuInput"

export { NeuInput }