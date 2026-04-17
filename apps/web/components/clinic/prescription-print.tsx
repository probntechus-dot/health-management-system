"use client"

import dynamic from "next/dynamic"
import type { PrescriptionDownloadButtonProps } from "@/components/clinic/prescription-pdf"
import type { PrintButtonProps } from "@/components/print/print-button"

export interface PrescriptionPrintButtonProps
  extends Omit<PrescriptionDownloadButtonProps, "disabled"> {
  /** Pass a ref to trigger print imperatively (e.g. Ctrl+P). */
  printRef?: PrintButtonProps["printRef"]
  className?: string
}

const PrescriptionPrintInner = dynamic(
  () => import("@/components/clinic/prescription-print-inner"),
  { ssr: false, loading: () => null },
)

export function PrescriptionPrintButton(props: PrescriptionPrintButtonProps) {
  return <PrescriptionPrintInner {...props} />
}
