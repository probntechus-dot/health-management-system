"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@workspace/ui/components/input"
import { visitsCache } from "@/lib/cache"
import type { PatientMatch } from "@/lib/cache"
import { findPatientsByContact } from "@/actions/patients"
import { Loader2Icon } from "lucide-react"

export type { PatientMatch }

interface ContactLookupProps {
  clinicSlug: string
  contact: string
  setContact: (v: string) => void
  onSelect: (match: PatientMatch) => void
  skipInitialSearch?: boolean
}

export function ContactLookup({
  clinicSlug,
  contact,
  setContact,
  onSelect,
  skipInitialSearch,
}: ContactLookupProps) {
  const [searchState, setSearchState] = useState<{
    searching: boolean
    matches: PatientMatch[]
    showMatches: boolean
  }>({ searching: false, matches: [], showMatches: false })
  const { searching, matches, showMatches } = searchState
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const skipRef = useRef(skipInitialSearch ?? false)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (skipRef.current) {
      skipRef.current = false
      return
    }

    debounceRef.current = setTimeout(async () => {
      if (contact.length < 3) {
        setSearchState({ searching: false, matches: [], showMatches: false })
        return
      }

      const cached = visitsCache.searchByContact(clinicSlug, contact)
      if (cached.length > 0) {
        setSearchState({ searching: false, matches: cached, showMatches: true })
        return
      }

      if (contact.length < 4) {
        setSearchState({ searching: false, matches: [], showMatches: false })
        return
      }
      setSearchState((prev) => ({
        ...prev,
        searching: true,
        matches: [],
        showMatches: false,
      }))
      const data = await findPatientsByContact(contact)
      setSearchState({
        searching: false,
        matches: data,
        showMatches: data.length > 0,
      })
    }, contact.length < 3 ? 0 : 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [contact, clinicSlug])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setSearchState((prev) => ({ ...prev, showMatches: false }))
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape")
        setSearchState((prev) => ({ ...prev, showMatches: false }))
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const handleSelect = (m: PatientMatch) => {
    setSearchState({ searching: false, matches: [], showMatches: false })
    onSelect(m)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          name="contact"
          type="tel"
          required
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          onFocus={() => {
            if (matches.length > 0)
              setSearchState((prev) => ({ ...prev, showMatches: true }))
          }}
          placeholder="03XX-XXXXXXX"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      {showMatches && (
        <div className="absolute left-0 right-0 mt-1 rounded-md border bg-popover shadow-md overflow-hidden z-20">
          {matches.map((m, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(m)}
              className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors border-b last:border-b-0 flex items-center justify-between text-sm"
            >
              <span className="font-medium">{m.full_name}</span>
              <span className="text-muted-foreground text-xs">
                {m.contact_number} &middot; {m.gender}
                {m.age ? ` · ${m.age}y` : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
