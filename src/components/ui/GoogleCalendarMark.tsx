import type { SVGProps } from "react";
import { cn } from "@/utils/cn";

export function GoogleCalendarMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 48 48" role="img" aria-label="Google Calendar" className={cn("h-6 w-6", className)} {...props}>
    <path fill="#fff" d="M8 9h32v30H8z" />
    <path fill="#4285f4" d="M40 9H8v30h32z" />
    <path fill="#fff" d="M12 17h24v18H12z" />
    <path fill="#34a853" d="M8 9h32v8H8z" />
    <path fill="#fbbc04" d="M8 9h8v8H8z" />
    <path fill="#ea4335" d="M32 9h8v8h-8z" />
    <path fill="#1a73e8" d="M21.2 21.3h5.1v9.5h-2.1v-7.4l-2 1.4v-2.1l-.9.6v-1.9z" />
  </svg>;
}
