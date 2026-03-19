'use server'

import { tenantSql } from '@/lib/db/tenant'

export type DashboardStats = {
  todayAppointments: number
  todayChecked: number
  todayWaiting: number
  todayCancelled: number
  weeklyVisits: { day: string; count: number }[]
  upcomingQueue: {
    id: string
    token_label: string
    patient_name: string
    reason_for_visit: string
    status: string
    created_at: string
  }[]
}

export async function fetchDashboardStats(clinicSlug: string): Promise<DashboardStats> {
  const sql = tenantSql(clinicSlug)

  const [todayCounts, weeklyVisits, upcomingQueue] = await Promise.all([
    // Today's visit counts by status
    sql<{ status: string; count: string }[]>`
      SELECT status, COUNT(*)::text AS count
      FROM visits
      WHERE created_at::date = CURRENT_DATE
      GROUP BY status
    `,

    // Weekly visits (last 7 days)
    sql<{ day: string; count: string }[]>`
      SELECT to_char(d.day, 'Dy') AS day, COALESCE(v.cnt, 0)::text AS count
      FROM generate_series(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        '1 day'
      ) AS d(day)
      LEFT JOIN (
        SELECT created_at::date AS visit_date, COUNT(*) AS cnt
        FROM visits
        WHERE created_at::date >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY created_at::date
      ) v ON v.visit_date = d.day
      ORDER BY d.day
    `,

    // Next patients in queue (waiting/called today)
    sql<{ id: string; token_label: string; patient_name: string; reason_for_visit: string; status: string; created_at: string }[]>`
      SELECT v.id, v.token_label, p.full_name AS patient_name,
             v.reason_for_visit, v.status, v.created_at::text
      FROM visits v
      JOIN patients p ON p.id = v.patient_id
      WHERE v.created_at::date = CURRENT_DATE
        AND v.status IN ('waiting', 'called')
      ORDER BY v.token_number ASC
      LIMIT 5
    `,
  ])

  const statusMap: Record<string, number> = {}
  for (const row of todayCounts) {
    statusMap[row.status] = parseInt(row.count)
  }

  const todayAppointments = Object.values(statusMap).reduce((a, b) => a + b, 0)

  return {
    todayAppointments,
    todayChecked: statusMap['checked'] ?? 0,
    todayWaiting: statusMap['waiting'] ?? 0,
    todayCancelled: statusMap['cancelled'] ?? 0,
    weeklyVisits: weeklyVisits.map((r) => ({ day: r.day, count: parseInt(r.count) })),
    upcomingQueue: upcomingQueue.map((r) => ({
      id: r.id,
      token_label: r.token_label,
      patient_name: r.patient_name,
      reason_for_visit: r.reason_for_visit,
      status: r.status,
      created_at: r.created_at,
    })),
  }
}
