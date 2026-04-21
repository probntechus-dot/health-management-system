'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@workspace/ui/components/button'
import { Card, CardContent } from '@workspace/ui/components/card'
import { AlertCircleIcon } from 'lucide-react'
import { logger } from '@/lib/logger'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Admin error boundary triggered', error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertCircleIcon className="mx-auto size-10 text-destructive" />
          <h2 className="text-lg font-semibold">Error in admin panel</h2>
          <p className="text-sm text-muted-foreground">
            An error occurred while loading this page. Please try again or
            return to the admin overview.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => reset()}>Try again</Button>
            <Button variant="outline" asChild>
              <Link href="/admin">Go to admin overview</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
