/* oxlint-disable react/only-export-components -- shadcn exports variants for composition. */
import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { LoaderCircle } from "lucide-react"

import { cn } from "@/utils/cn"
import type { ActionVariant } from "./semantics"

const actionVariantClasses = {
  primary: "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
  secondary: "border-secondary bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
  outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  danger: "border-destructive bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
  warning: "border-warning bg-warning text-warning-foreground shadow-sm hover:bg-warning/90",
  link: "text-primary underline-offset-4 hover:underline",
} satisfies Record<ActionVariant, string>

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: actionVariantClasses,
      size: {
        default: "px-4 py-2",
        sm: "min-h-11 rounded-md px-3 text-sm",
        lg: "min-h-12 rounded-md px-8 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
  trailingIcon?: React.ReactNode
  isLoading?: boolean
  loadingLabel?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    className,
    icon,
    trailingIcon,
    isLoading = false,
    loadingLabel = "Working",
    variant = "primary",
    size,
    asChild = false,
    disabled,
    onClick,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        aria-busy={isLoading || undefined}
        aria-disabled={isLoading || disabled || undefined}
        disabled={asChild ? undefined : isLoading || disabled}
        onClick={(event) => {
          if (isLoading || disabled) {
            event.preventDefault()
            return
          }
          onClick?.(event)
        }}
        {...props}
      >
        {isLoading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : icon}
        {isLoading ? <span className="sr-only">{loadingLabel}: </span> : null}
        <Slottable>{children}</Slottable>
        {!isLoading ? trailingIcon : null}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
