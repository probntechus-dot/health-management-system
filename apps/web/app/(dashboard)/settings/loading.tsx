import { Skeleton } from "@workspace/ui/components/skeleton"

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-lg">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  )
}
