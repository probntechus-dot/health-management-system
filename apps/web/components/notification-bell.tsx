"use client"

import { useState, useEffect, useTransition } from "react"
import { BellIcon, CheckIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import {
  getNotifications,
  markAllRead,
  markNotificationRead,
  type NotificationRow,
} from "@/actions/notifications"

const TYPE_STYLES: Record<NotificationRow["type"], string> = {
  info: "border-l-blue-400",
  warning: "border-l-yellow-400",
  urgent: "border-l-red-500",
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [isPending, startTransition] = useTransition()

  const unread = notifications.filter((n) => !n.is_read).length

  const load = () => {
    getNotifications().then(setNotifications).catch(() => {})
  }

  useEffect(() => {
    load()
  }, [])

const handleMarkAll = () => {
    startTransition(async () => {
      await markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    })
  }

  const handleMarkOne = (id: string) => {
    startTransition(async () => {
      await markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative" aria-label="Notifications">
          <BellIcon className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
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
              No notifications
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
