"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@workspace/ui/components/button"
import { PrinterIcon, Loader2Icon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

async function printBlob(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob)
  const iframe = document.createElement("iframe")
  iframe.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;border:0;opacity:0;"
  document.body.appendChild(iframe)
  iframe.src = url
  await new Promise<void>((resolve, reject) => {
    iframe.onload = () => setTimeout(resolve, 300) // brief pause for PDF to render inside iframe
    setTimeout(() => reject(new Error("timeout")), 15_000)
  })
  iframe.contentWindow?.focus()
  iframe.contentWindow?.print()
  // Can't detect when the native print dialog closes — clean up after a safe delay
  setTimeout(() => { URL.revokeObjectURL(url); iframe.remove() }, 120_000)
}

export interface PrintButtonProps {
  /** Returns the PDF blob to print. Called on every click. */
  getPdfBlob: () => Promise<Blob>
  /**
   * Optional ref — set to the click handler so a parent can trigger print
   * imperatively (e.g. Ctrl+P interception) without DOM queries.
   */
  printRef?: React.RefObject<(() => void) | null>
  className?: string
}

export function PrintButton({ getPdfBlob, printRef, className }: PrintButtonProps) {
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const getPdfBlobRef = useRef(getPdfBlob)
  getPdfBlobRef.current = getPdfBlob // always fresh, no stale closure

  const handleClick = useCallback(async () => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    try {
      const blob = await getPdfBlobRef.current()
      await printBlob(blob)
    } catch {
      alert("Failed to prepare print. Please try again.")
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }, []) // stable — reads from refs

  // Expose handle to parent for Ctrl+P or other imperative triggers
  useEffect(() => {
    if (printRef) printRef.current = handleClick
    return () => { if (printRef) printRef.current = null }
  }, [printRef, handleClick])

  return (
    <Button
      type="button"
      variant="outline"
      disabled={busy}
      onClick={handleClick}
      className={cn(className)}
    >
      {busy ? <Loader2Icon className="animate-spin" /> : <PrinterIcon />}
      {busy ? "Preparing…" : "Print"}
    </Button>
  )
}
