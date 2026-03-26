import { Skeleton } from "@workspace/ui/components/skeleton"

export default function ClinicAdminLoading() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      {/* Limit cards */}
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      {/* Users table */}
      <div className="border rounded-xl overflow-hidden">
        <Skeleton className="h-12 w-full rounded-none" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-none border-t" />
        ))}
      </div>
    </div>
  )
}
