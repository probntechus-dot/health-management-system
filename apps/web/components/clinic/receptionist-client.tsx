"use client"

import { useState } from "react"
import { PatientForm } from "@/components/clinic/patient-form"
import { PatientQueue } from "@/components/clinic/patient-queue"

type Prefill = {
  full_name: string
  age: number | null
  gender: string
  contact: string
  address: string
}

export function ReceptionistClient({ clinicSlug }: { clinicSlug: string }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [prefill, setPrefill] = useState<Prefill | undefined>()

  const handleReAdd = (data: Prefill) => {
    setPrefill(data)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(360px,420px)_1fr] gap-4 items-start">
      <PatientForm
        clinicSlug={clinicSlug}
        prefill={prefill}
        onSuccess={() => {
          setRefreshKey((k) => k + 1)
          setPrefill(undefined)
        }}
      />
      <div className="overflow-y-auto lg:h-[calc(100vh-120px)]">
        <PatientQueue
          clinicSlug={clinicSlug}
          userRole="receptionist"
          refreshKey={refreshKey}
          onReAdd={handleReAdd}
        />
      </div>
    </div>
  )
}
