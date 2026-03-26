import { Skeleton } from "@workspace/ui/components/skeleton"

export default function DoctorPatientsLoading() {
  return (
    <div className="flex flex-col gap-4 max-w-5xl">
      {/* Filter/search bar */}
      <Skeleton className="h-20 rounded-xl" />
      {/* Queue rows */}
      <div className="border rounded-lg overflow-hidden">
        <Skeleton className="h-10 w-full rounded-none" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-none border-t" />
        ))}
      </div>
    </div>
  )
}
