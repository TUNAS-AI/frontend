import * as React from "react"

import { cn } from "@/utils/cn"

const Skeleton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} aria-hidden="true" className={cn("skeleton rounded-md", className)} {...props} />
  ),
)
Skeleton.displayName = "Skeleton"

export { Skeleton }
