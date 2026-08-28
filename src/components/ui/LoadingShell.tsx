import { Skeleton } from "./Skeleton"

function LoadingShell({ label = "Loading content…" }: { label?: string }) {
  return (
    <section className="motion-enter grid gap-5 rounded-lg border bg-card p-5 sm:p-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="grid gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-3/4 max-w-md" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-3 border-t pt-5">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </section>
  )
}

export { LoadingShell }
