import postgres from 'postgres'

declare global {
  // eslint-disable-next-line no-var
  var __appPool: postgres.Sql | undefined
  // eslint-disable-next-line no-var
  var __adminPool: postgres.Sql | undefined
}

// Application pool — limited privileges, used for all clinic queries
export const appPool: postgres.Sql =
  globalThis.__appPool ??
  (globalThis.__appPool = postgres(process.env.DATABASE_URL!, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
  }))

// Admin pool — superuser, used only for DDL (CREATE/DROP SCHEMA, provisioning).
//
// Each createClinicSchema / dropClinicSchema call runs inside a single
// sql.begin() transaction that holds one connection for its full duration.
// With max:2, two simultaneous provisions would exhaust the pool and any
// third caller (e.g. an admin action running on the same request cycle) would
// block waiting for a connection — a classic pool deadlock.
//
// max:5 gives comfortable headroom for concurrent admin operations while
// keeping the superuser connection count low (superuser connections bypass
// pg_hba row-level limits and should be kept to a minimum on shared servers).
export const adminPool: postgres.Sql =
  globalThis.__adminPool ??
  (globalThis.__adminPool = postgres(process.env.DATABASE_ADMIN_URL!, {
    max: 5,
    idle_timeout: 30,
    connect_timeout: 10,
  }))
