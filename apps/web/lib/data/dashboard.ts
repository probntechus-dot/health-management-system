import { unstable_cache } from 'next/cache'
import { tenantSql } from '@/lib/db/tenant'

export type DashboardStats = {
  todayAppointments: number
  todayChecked: number
  todayWaiting: number
  todayCancelled: number
  weeklyVisits: { day: string; all: number; checked: number; waiting: number; cancelled: number }[]
  upcomingQueue: {
    id: string
    token_label: string
    patient_name: string
    reason_for_visit: string
    status: string
    created_at: string
  }[]
  todayFollowUps: {
    id: string
    patient_name: string
    contact: string
    last_diagnosis: string | null
  }[]
}

async function _fetchDashboardStats(clinicSlug: string, doctorIds: string[]): Promise<DashboardStats> {
  const sql = tenantSql(clinicSlug)

  const [todayCounts, weeklyVisits, upcomingQueue, todayFollowUps] = await Promise.all([
    // Today's visit counts by status
    sql<{ status: string; count: string }[]>`
      SELECT status, COUNT(*)::text AS count
      FROM visits
      WHERE created_at::date = CURRENT_DATE
        AND doctor_id = ANY(${doctorIds})
      GROUP BY status
    `,

    // Weekly visits (last 7 days) with status breakdown
    sql<{ day: string; all_count: string; checked: string; waiting: string; cancelled: string }[]>`
      SELECT
        to_char(d.day, 'Dy') AS day,
        COALESCE(v.all_count, 0)::text AS all_count,
        COALESCE(v.checked, 0)::text AS checked,
        COALESCE(v.waiting, 0)::text AS waiting,
        COALESCE(v.cancelled, 0)::text AS cancelled
      FROM generate_series(
        CURRENT_DATE - INTERVAL '6 days',
        CURRENT_DATE,
        '1 day'
      ) AS d(day)
      LEFT JOIN (
        SELECT
          created_at::date AS visit_date,
          COUNT(*) AS all_count,
          COUNT(*) FILTER (WHERE status = 'checked') AS checked,
          COUNT(*) FILTER (WHERE status = 'waiting') AS waiting,
          COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
        FROM visits
        WHERE created_at::date >= CURRENT_DATE - INTERVAL '6 days'
          AND doctor_id = ANY(${doctorIds})
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
        AND v.doctor_id = ANY(${doctorIds})
        AND v.status IN ('waiting', 'called')
      ORDER BY v.token_number ASC
      LIMIT 8
    `,

    // Patients with follow-up due today
    sql<{ id: string; patient_name: string; contact: string; last_diagnosis: string | null }[]>`
      SELECT p.id, p.full_name AS patient_name,
             p.contact_number AS contact,
             pr.diagnosis AS last_diagnosis
      FROM prescriptions pr
      JOIN visits v ON v.id = pr.visit_id
      JOIN patients p ON p.id = v.patient_id
      WHERE pr.follow_up = CURRENT_DATE
        AND v.doctor_id = ANY(${doctorIds})
      ORDER BY pr.created_at DESC
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
    weeklyVisits: weeklyVisits.map((r) => ({
      day: r.day,
      all: parseInt(r.all_count),
      checked: parseInt(r.checked),
      waiting: parseInt(r.waiting),
      cancelled: parseInt(r.cancelled),
    })),
    upcomingQueue: upcomingQueue.map((r) => ({
      id: r.id,
      token_label: r.token_label,
      patient_name: r.patient_name,
      reason_for_visit: r.reason_for_visit,
      status: r.status,
      created_at: r.created_at,
    })),
    todayFollowUps: todayFollowUps.map((r) => ({
      id: r.id,
      patient_name: r.patient_name,
      contact: r.contact,
      last_diagnosis: r.last_diagnosis,
    })),
  }
}

export function fetchDashboardStats(clinicSlug: string, doctorIds: string[]): Promise<DashboardStats> {
  const key = `dashboard-stats-${clinicSlug}-${doctorIds.sort().join(',')}`
  return unstable_cache(
    () => _fetchDashboardStats(clinicSlug, doctorIds),
    [key],
    { tags: [`dashboard:${clinicSlug}`] }
  )()
}
