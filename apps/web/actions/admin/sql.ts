"use server"

import { adminPool } from "@/lib/db/index"
import { requireAdmin } from "./auth"

const SQL_ROW_CAP = 500

export type SqlResult =
  | {
      columns: string[]
      rows: string[][]
      rowCount: number
      command: string
      capped: boolean
    }
  | { error: string }

export async function runAdminSql(query: string): Promise<SqlResult> {
  await requireAdmin()

  query = query.trim()
  if (!query) return { error: "Query is empty" }

  try {
    const result = await adminPool.unsafe(query)
    const columns: string[] =
      result.columns?.map((c: { name: string }) => c.name) ?? []
    const allRows = Array.from(result)
    const capped = allRows.length > SQL_ROW_CAP
    const rows = allRows.slice(0, SQL_ROW_CAP).map((row) =>
      columns.map((col) => {
        const v = (row as Record<string, unknown>)[col]
        return v === null ? "NULL" : v === undefined ? "" : String(v)
      })
    )

    return {
      columns,
      rows,
      rowCount: result.count ?? allRows.length,
      command: result.command ?? "",
      capped,
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}
