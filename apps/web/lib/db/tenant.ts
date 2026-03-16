import { appPool } from './index'
import type postgres from 'postgres'

/** Validates a clinic slug — must be lowercase alphanumeric + underscores only. */
function assertValidSlug(slug: string): void {
  if (!/^[a-z0-9_]+$/.test(slug)) {
    throw new Error(`Invalid clinic slug: "${slug}"`)
  }
}

/**
 * Returns a postgres.js sql executor scoped to clinic_{slug} schema.
 * Every query runs inside a transaction with SET LOCAL search_path,
 * so table references like `patients` resolve to `clinic_{slug}.patients`.
 *
 * Usage:
 *   const rows = await tenantSql(clinicSlug)`SELECT * FROM patients WHERE id = ${id}`
 */
export function tenantSql(clinicSlug: string) {
  assertValidSlug(clinicSlug)
  const schema = `clinic_${clinicSlug}`

  return async function sql<T extends readonly Record<string, unknown>[]>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T> {
    return appPool.begin(async (tx) => {
      await tx.unsafe(`SET LOCAL search_path TO "${schema}", public`)
      // TransactionSql loses call signatures via Omit in postgres.js types.
      // The cast to postgres.Sql restores them — tx IS callable at runtime.
      return (tx as unknown as postgres.Sql)<T>(
        strings,
        ...(values as postgres.ParameterOrFragment<never>[])
      ) as Promise<T>
    }) as Promise<T>
  }
}
