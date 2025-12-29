import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // PRIMARY - Bold brand color for main actions (Submit, Book, Enroll, Confirm, Save, Sign In)
        default: "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 active:scale-[0.98]",

        // SECONDARY - Outline style for secondary actions (Cancel, Back, Skip)
        secondary: "border-2 border-brand-500 text-brand-500 bg-transparent hover:bg-brand-50 active:bg-brand-100 active:scale-[0.98]",

        // OUTLINE - Lighter outline for tertiary actions
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",

        // GHOST - Minimal for nav items, icon buttons
        ghost: "hover:bg-brand-50 hover:text-brand-600 active:bg-brand-100 active:scale-[0.98]",

        // DESTRUCTIVE - Red for delete/remove actions
        destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 active:scale-[0.98]",

        // LINK - Text link style
        link: "text-brand-500 underline-offset-4 hover:underline hover:text-brand-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
