"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { EyeIcon, EyeOffIcon } from "lucide-react"

export function PasswordCell({ password }: { password: string | null }) {
  const [visible, setVisible] = useState(false)
  if (!password) return <span className="text-muted-foreground text-xs">&mdash;</span>
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs">
        {visible ? password : "••••••••"}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOffIcon className="size-3" /> : <EyeIcon className="size-3" />}
      </Button>
    </div>
  )
}
