/* oxlint-disable react/only-export-components -- shadcn exports variants for composition. */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/cn";

const chatBubbleVariants = cva(
  "max-w-[88%] whitespace-pre-line rounded-xl px-3 py-2 text-sm leading-6",
  {
    variants: {
      variant: {
        assistant: "rounded-bl-sm bg-muted text-foreground",
        user: "rounded-br-sm bg-primary text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "assistant",
    },
  },
);

export interface ChatBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleVariants> {}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ className, variant = "assistant", children, ...props }, ref) => (
    <div
      className={cn("flex", variant === "user" ? "justify-end" : "justify-start")}
      data-role={variant}
    >
      <div
        ref={ref}
        className={cn(chatBubbleVariants({ variant }), className)}
        {...props}
      >
        {children}
      </div>
    </div>
  ),
);
ChatBubble.displayName = "ChatBubble";

export { ChatBubble, chatBubbleVariants };
