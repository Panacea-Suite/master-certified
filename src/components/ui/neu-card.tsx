import * as React from "react"
import { cn } from "@/lib/utils"

const NeuCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "pressed" | "flat" | "subtle"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "neu-card",
    pressed: "neu-pressed rounded-3xl",
    flat: "neu-container",
    subtle: "neu-subtle"
  }
  
  return (
    <div
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    />
  )
})
NeuCard.displayName = "NeuCard"

const NeuCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
NeuCardHeader.displayName = "NeuCardHeader"

const NeuCardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xl font-semibold leading-none tracking-tight text-foreground", className)}
    {...props}
  />
))
NeuCardTitle.displayName = "NeuCardTitle"

const NeuCardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-foreground/70", className)}
    {...props}
  />
))
NeuCardDescription.displayName = "NeuCardDescription"

const NeuCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
NeuCardContent.displayName = "NeuCardContent"

const NeuCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
NeuCardFooter.displayName = "NeuCardFooter"

export { NeuCard, NeuCardHeader, NeuCardFooter, NeuCardTitle, NeuCardDescription, NeuCardContent }