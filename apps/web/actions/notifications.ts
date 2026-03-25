'use server'

import { appPool } from '@/lib/db/index'
import { requireAuth } from '@/lib/auth'

export type NotificationRow = {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'urgent'
  is_read: boolean
  created_at: string
}

export async function getNotifications(): Promise<NotificationRow[]> {
  const session = await requireAuth()
  const rows = await appPool<NotificationRow[]>`
    SELECT id, title, message, type, is_read, created_at::TEXT AS created_at
    FROM notifications
    WHERE clinic_id = ${session.clinicId}
    ORDER BY created_at DESC
    LIMIT 50
  `
  return rows
}

export async function getUnreadCount(): Promise<number> {
  const session = await requireAuth()
  const [row] = await appPool<{ count: number }[]>`
    SELECT COUNT(*)::INT AS count
    FROM notifications
    WHERE clinic_id = ${session.clinicId} AND is_read = false
  `
  return row?.count ?? 0
}

export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  const session = await requireAuth()
  await appPool`
    UPDATE notifications SET is_read = true
    WHERE id = ${notificationId} AND clinic_id = ${session.clinicId}
  `
}

export async function markAllRead(): Promise<void> {
  const session = await requireAuth()
  await appPool`
    UPDATE notifications SET is_read = true
    WHERE clinic_id = ${session.clinicId} AND is_read = false
  `
}
