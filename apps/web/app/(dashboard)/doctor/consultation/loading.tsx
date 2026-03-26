import { Skeleton } from "@workspace/ui/components/skeleton"

export default function ConsultationLoading() {
  return (
    <div className="flex flex-col gap-4 max-w-5xl">
      {/* Queue skeleton */}
      <Skeleton className="h-10 w-56" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4 items-start">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        {/* Prescription panel skeleton */}
        <Skeleton className="h-[520px] rounded-xl" />
      </div>
    </div>
  )
}
