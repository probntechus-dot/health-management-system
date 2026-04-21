"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import { BellIcon, CheckIcon, AlertCircleIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  getNotifications,
  markAllRead,
  markNotificationRead,
  type NotificationRow,
} from "@/actions/notifications"
import { getCached, setCacheWithTTL, invalidateCache } from "@/lib/client-cache"
import { logger } from "@/lib/logger"

// Cache key and TTL for notification data.
// 60s is long enough to prevent redundant fetches on rapid navigation,
// but short enough that a new notification sent during a session appears
// within a minute without a full page reload.
const NOTIF_CACHE_KEY = "notifications:v1"
const NOTIF_CACHE_TTL_MS = 10_000

const TYPE_STYLES: Record<NotificationRow["type"], string> = {
  info: "border-l-blue-400",
  warning: "border-l-yellow-400",
  urgent: "border-l-red-500",
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationRow[]>(() => {
    return getCached<NotificationRow[]>(NOTIF_CACHE_KEY) ?? []
  })
  const [isPending, startTransition] = useTransition()
  const [fetchError, setFetchError] = useState(false)

  const unread = notifications.filter((n) => !n.is_read).length

  const load = useCallback(() => {
    const cached = getCached<NotificationRow[]>(NOTIF_CACHE_KEY)
    if (cached) {
      setNotifications(cached)
      setFetchError(false)
      return
    }
    getNotifications().then((data) => {
      setCacheWithTTL(NOTIF_CACHE_KEY, data, NOTIF_CACHE_TTL_MS)
      setNotifications(data)
      setFetchError(false)
    }).catch((err) => {
      logger.error('Failed to load notifications', err)
      setFetchError(true)
    })
  }, [])

  useEffect(() => {
    load()
  }, [load])

const handleMarkAll = () => {
    startTransition(async () => {
      await markAllRead()
      const updated = notifications.map((n) => ({ ...n, is_read: true }))
      invalidateCache(NOTIF_CACHE_KEY)
      setNotifications(updated)
    })
  }

  const handleMarkOne = (id: string) => {
    startTransition(async () => {
      await markNotificationRead(id)
      const updated = notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      invalidateCache(NOTIF_CACHE_KEY)
      setNotifications(updated)
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label={fetchError ? "Notifications unavailable — tap to retry" : "Notifications"}
          onClick={fetchError ? (e) => { e.preventDefault(); load() } : undefined}
        >
          <BellIcon className="size-4" />
          {fetchError ? (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              !
            </span>
          ) : unread > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={handleMarkAll}
              disabled={isPending}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No notifications.
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`border-l-4 px-4 py-3 ${TYPE_STYLES[n.type]} ${
                    n.is_read ? "opacity-60" : "bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground whitespace-pre-wrap">{n.message}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!n.is_read && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0"
                        onClick={() => handleMarkOne(n.id)}
                        disabled={isPending}
                        aria-label="Mark as read"
                      >
                        <CheckIcon />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
