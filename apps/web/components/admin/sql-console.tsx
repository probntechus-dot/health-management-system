"use client"

import { useState, useTransition } from "react"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { runAdminSql, type SqlResult } from "@/actions/admin/sql"
import { Loader2Icon, AlertCircleIcon, PlayIcon } from "lucide-react"

export function SqlConsole() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<SqlResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleRun = () => {
    if (!query.trim()) return
    startTransition(async () => {
      const res = await runAdminSql(query)
      setResult(res)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      handleRun()
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">SQL Console</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={6}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="SELECT * FROM clinics LIMIT 10;"
            className="font-mono text-sm"
          />
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRun}
              disabled={isPending || !query.trim()}
            >
              {isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <PlayIcon />
              )}
              Run Query
            </Button>
            <span className="text-xs text-muted-foreground">
              Ctrl+Enter to run
            </span>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="py-4">
            {"error" in result ? (
              <Alert variant="destructive">
                <AlertCircleIcon className="size-4" />
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            ) : result.rows.length > 0 ? (
              <ScrollArea className="max-h-[400px]">
                <div className="mb-2 text-xs text-muted-foreground">
                  {result.rowCount} row{result.rowCount !== 1 ? "s" : ""}
                  {result.capped && " (capped at 500)"}
                  {result.command && ` — ${result.command}`}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {result.columns.map((col) => (
                        <TableHead key={col} className="text-xs">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.rows.map((row, i) => (
                      <TableRow key={i}>
                        {row.map((val, j) => (
                          <TableCell key={j} className="font-mono text-xs">
                            {val}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground">
                Query executed. {result.rowCount ?? 0} rows affected.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
