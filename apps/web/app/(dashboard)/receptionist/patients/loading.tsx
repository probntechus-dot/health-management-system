import { Skeleton } from "@workspace/ui/components/skeleton"

export default function ReceptionistPatientsLoading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(360px,420px)_1fr] gap-4 items-start">
      {/* Patient form skeleton */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-10 rounded-lg" />
      </div>
      {/* Queue skeleton */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <div className="border rounded-lg overflow-hidden">
          <Skeleton className="h-10 w-full rounded-none" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-none border-t" />
          ))}
        </div>
      </div>
    </div>
  )
}
