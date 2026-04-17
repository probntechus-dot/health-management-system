// HTML previews for prescription templates — no @react-pdf/renderer, instant render.
// Each preview faithfully mirrors its PDF counterpart's colors, layout, and personality.

const DR_FALLBACK = 'Dr. Sarah Ahmed'
const CRED_FALLBACK = 'MBBS, FCPS'
const SPEC_FALLBACK = 'General Physician'
const DATE = 'Apr 17, 2026'
const PATIENT_NAME = 'Ahmed Khan'
const PATIENT_AGE = '45 yrs / Male'
const PATIENT_PHONE = '0300-1234567'
const MR = 'MR-000142'
const DIAG = 'Acute bronchitis with mild pharyngitis'
const PROBLEMS = 'Persistent cough for 5 days, sore throat, low-grade fever'
const MEDS = [
  { n: 'Azithromycin 500mg', d: '1 tab · Once Daily · 3 days' },
  { n: 'Ibuprofen 400mg', d: '1 tab · Three Times Daily · 5 days' },
  { n: 'Dextromethorphan 10mg/5ml', d: '2 tsp · Twice Daily · 5 days' },
]
const NOTES = 'Drink plenty of warm fluids. Avoid cold beverages. Rest for 2–3 days.'
const ALLERGY = 'Penicillin'
const FOLLOW_UP = 'Apr 24, 2026'
const TESTS = ['CBC', 'Chest X-Ray']
const CLINIC = { phone: '042-35761234', address: '123 Medical Plaza, Lahore', web: 'www.clinic.example.com' }

// ── Shared wrapper ────────────────────────────────────────────────────────────

function Paper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', minHeight: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 10, color: '#1A1A1A' }}>
      {children}
    </div>
  )
}

// ── Classic ───────────────────────────────────────────────────────────────────

function ClassicPreview({ dr, spec }: { dr: string; spec: string }) {
  return (
    <Paper>
      <div style={{ height: 4, background: '#1B3A5C' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px 12px' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1B3A5C', fontFamily: 'Georgia, Times New Roman, serif', letterSpacing: 0.4 }}>{dr}</div>
          <div style={{ fontSize: 8.5, color: '#5A6575', marginTop: 2, lineHeight: 1.5 }}>{spec}</div>
          <div style={{ fontSize: 7.5, color: '#8A95A5', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 3 }}>{""}</div>
        </div>
        <div style={{ fontSize: 9 }}>
          {([['Name', PATIENT_NAME], ['Age', PATIENT_AGE], ['Phone', PATIENT_PHONE], ['MR #', MR], ['Date', DATE]] as [string, string][]).map(([l, v]) => (
            <div key={l} style={{ display: 'flex', gap: 6, marginBottom: 2, alignItems: 'flex-start' }}>
              <span style={{ color: '#8A95A5', width: 36, flexShrink: 0 }}>{l}</span>
              <span style={{ fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 0.75, background: '#C5CDD8', margin: '0 24px' }} />

      <div style={{ margin: '10px 24px 0', background: '#FEF2F2', border: '0.75px solid #FCA5A5', borderRadius: 3, padding: '5px 8px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: 0.5 }}>Allergies:</span>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#DC2626' }}>{ALLERGY}</span>
      </div>

      <div style={{ display: 'flex', flex: 1, padding: '12px 24px 0', gap: 0 }}>
        <div style={{ width: '32%', paddingRight: 16 }}>
          <div style={{ fontSize: 7.5, fontWeight: 700, color: '#1B3A5C', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Diagnosis</div>
          <div style={{ fontSize: 10, lineHeight: 1.65, marginBottom: 16 }}>{DIAG}</div>
          <div style={{ fontSize: 7.5, fontWeight: 700, color: '#1B3A5C', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Problem List</div>
          <div style={{ fontSize: 10, lineHeight: 1.65 }}>{PROBLEMS}</div>
        </div>

        <div style={{ width: 0.5, background: '#C5CDD8', margin: '0 0 0 0', alignSelf: 'stretch' }} />

        <div style={{ flex: 1, paddingLeft: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 24, fontFamily: 'Georgia, Times New Roman, serif', fontStyle: 'italic', fontWeight: 700, color: '#1B3A5C', lineHeight: 1 }}>Rx</span>
            <span style={{ fontSize: 7.5, fontWeight: 700, color: '#1B3A5C', textTransform: 'uppercase', letterSpacing: 1 }}>Prescribed Medications</span>
          </div>
          {MEDS.map((m, i) => (
            <div key={i} style={{ marginBottom: 11, paddingBottom: 10, borderBottom: i < MEDS.length - 1 ? '0.5px solid #C5CDD8' : 'none' }}>
              <div style={{ fontSize: 8, color: '#8A95A5', marginBottom: 2 }}>({i + 1})</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2 }}>{m.n}</div>
              <div style={{ fontSize: 8.5, color: '#5A6575' }}>{m.d}</div>
            </div>
          ))}
          <div style={{ background: '#F5F7FA', padding: '7px 10px', borderRadius: 3, marginTop: 12 }}>
            <div style={{ fontSize: 7, fontWeight: 700, color: '#1B3A5C', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Advice</div>
            <div style={{ fontSize: 9.5, lineHeight: 1.65 }}>{NOTES}</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
            {TESTS.map(t => <span key={t} style={{ fontSize: 8.5, color: '#1B3A5C', background: '#F5F7FA', padding: '3px 8px', borderRadius: 3, border: '0.5px solid #C5CDD8' }}>{t}</span>)}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 14 }}>
            <span style={{ fontSize: 9, color: '#5A6575' }}>Follow-up:</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#1B3A5C' }}>{FOLLOW_UP}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 24px 6px', display: 'flex', justifyContent: 'flex-end' }}>
        <div>
          <div style={{ width: 170, borderBottom: '0.5px solid #C5CDD8', marginBottom: 4 }} />
          <div style={{ fontSize: 8.5, color: '#5A6575', fontFamily: 'Georgia, Times New Roman, serif', fontStyle: 'italic' }}>{dr}</div>
        </div>
      </div>

      <div style={{ borderTop: '0.75px solid #C5CDD8', margin: '0 24px', padding: '6px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          {[CLINIC.phone, CLINIC.address, CLINIC.web].map(t => <span key={t} style={{ fontSize: 7, color: '#8A95A5' }}>{t}</span>)}
        </div>
        <div style={{ fontSize: 6, color: '#8A95A5', textAlign: 'center' }}>This is a computer-generated prescription</div>
      </div>

      <div style={{ height: 4, background: '#1B3A5C' }} />
    </Paper>
  )
}

// ── Modern ────────────────────────────────────────────────────────────────────

function ModernPreview({ dr, spec }: { dr: string; spec: string }) {
  return (
    <Paper>
      <div style={{ background: '#1565C0', padding: '20px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 21, fontWeight: 700, color: '#fff', letterSpacing: 0.3, marginBottom: 3 }}>{dr}</div>
          <div style={{ fontSize: 8.5, color: '#B3D4FC', lineHeight: 1.5 }}>{spec}</div>
          <div style={{ fontSize: 8.5, color: '#B3D4FC' }}>{""}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 7, color: '#90CAF9', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>Date</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{DATE}</div>
        </div>
      </div>

      <div style={{ background: '#E3F2FD', borderBottom: '1px solid #BBDEFB', padding: '9px 28px', display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {([['Patient', PATIENT_NAME], ['Age', PATIENT_AGE], ['Phone', PATIENT_PHONE], ['MR #', MR]] as [string, string][]).map(([l, v]) => (
          <div key={l} style={{ display: 'flex', gap: 4 }}>
            <span style={{ fontSize: 8, color: '#616161' }}>{l}:</span>
            <span style={{ fontSize: 9, fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ background: '#FFEBEE', borderBottom: '1px solid #EF9A9A', padding: '6px 28px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ background: '#C62828', color: '#fff', fontSize: 7, fontWeight: 700, padding: '2px 5px', borderRadius: 3, textTransform: 'uppercase' }}>Allergy</span>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#C62828' }}>{ALLERGY}</span>
      </div>

      <div style={{ padding: '16px 28px', flex: 1 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1565C0', marginBottom: 5 }}>Diagnosis</div>
        <div style={{ fontSize: 10, lineHeight: 1.65, marginBottom: 4 }}>{DIAG}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0 10px' }}>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: '#1565C0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1 }}>Rx</span>
          </div>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#1565C0' }}>Prescribed Medications</span>
        </div>

        {MEDS.map((m, i) => (
          <div key={i} style={{ display: 'flex', marginBottom: 8, border: '0.5px solid #E0E0E0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: 30, background: '#E3F2FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#1565C0' }}>{i + 1}</span>
            </div>
            <div style={{ width: 3, background: '#1565C0', flexShrink: 0 }} />
            <div style={{ padding: '7px 10px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, marginBottom: 2 }}>{m.n}</div>
              <div style={{ fontSize: 8.5, color: '#616161' }}>{m.d}</div>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, margin: '10px 0' }}>
          {TESTS.map(t => <span key={t} style={{ fontSize: 8.5, fontWeight: 700, color: '#0D47A1', background: '#E3F2FD', padding: '3px 10px', borderRadius: 12 }}>{t}</span>)}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 14 }}>
          <span style={{ fontSize: 9, color: '#616161' }}>Follow-up:</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#1565C0' }}>{FOLLOW_UP}</span>
        </div>
      </div>

      <div style={{ background: '#E3F2FD', borderTop: '2px solid #1565C0', padding: '7px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          {[CLINIC.phone, CLINIC.address, CLINIC.web].map(t => <span key={t} style={{ fontSize: 7.5, color: '#616161' }}>{t}</span>)}
        </div>
        <div style={{ fontSize: 6, color: '#616161', textAlign: 'center' }}>This is a computer-generated prescription</div>
      </div>
    </Paper>
  )
}

// ── Minimal ───────────────────────────────────────────────────────────────────

function MinimalPreview({ dr, spec }: { dr: string; spec: string }) {
  return (
    <Paper>
      <div style={{ padding: '40px 44px 0' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#111', letterSpacing: 0.6, marginBottom: 3 }}>{dr}</div>
        <div style={{ fontSize: 8, color: '#777', lineHeight: 1.5 }}>{spec}</div>
        <div style={{ fontSize: 8, color: '#777' }}>{""}</div>
      </div>

      <div style={{ borderBottom: '1.5px solid #111', margin: '16px 44px' }} />

      <div style={{ padding: '0 44px', display: 'flex', flexWrap: 'wrap', gap: 28 }}>
        {([['Patient', PATIENT_NAME], ['Age', PATIENT_AGE.split('/')[0]!.trim()], ['Gender', 'Male'], ['Phone', PATIENT_PHONE], ['MR No.', MR], ['Date', DATE]] as [string, string][]).map(([l, v]) => (
          <div key={l}>
            <div style={{ fontSize: 6.5, color: '#777', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 2 }}>{l}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#111' }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ margin: '14px 44px 0', border: '1px solid #B91C1C', borderRadius: 2, padding: '5px 10px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 6.5, fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: 1 }}>Allergies</span>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#B91C1C' }}>{ALLERGY}</span>
      </div>

      <div style={{ borderBottom: '0.5px solid #D5D5D5', margin: '14px 44px' }} />

      <div style={{ padding: '0 44px', flex: 1 }}>
        <div style={{ fontSize: 6.5, color: '#777', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 6 }}>Diagnosis</div>
        <div style={{ fontSize: 10, color: '#111', lineHeight: 1.7, marginBottom: 20 }}>{DIAG}</div>

        <div style={{ fontSize: 6.5, color: '#777', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 6 }}>Medications</div>
        {MEDS.map((m, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#111', marginBottom: 2 }}>{i + 1}. {m.n}</div>
            <div style={{ fontSize: 8.5, color: '#333' }}>{m.d}</div>
          </div>
        ))}

        <div style={{ fontSize: 6.5, color: '#777', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 6, marginTop: 20 }}>Advice</div>
        <div style={{ fontSize: 10, lineHeight: 1.7 }}>{NOTES}</div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 20 }}>
          {TESTS.map(t => <span key={t} style={{ fontSize: 7.5, color: '#111', border: '0.5px solid #AAA', padding: '3px 8px', borderRadius: 2 }}>{t}</span>)}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 6.5, color: '#777', textTransform: 'uppercase', letterSpacing: 0.5 }}>Follow-up:</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#111' }}>{FOLLOW_UP}</span>
        </div>
      </div>

      <div style={{ padding: '20px 44px 10px', display: 'flex', justifyContent: 'flex-end' }}>
        <div>
          <div style={{ width: 150, borderBottom: '0.5px solid #AAA', marginBottom: 4 }} />
          <div style={{ fontSize: 7.5, color: '#777' }}>{dr}</div>
        </div>
      </div>

      <div style={{ borderTop: '0.5px solid #D5D5D5', margin: '0 44px', padding: '8px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          {[CLINIC.phone, CLINIC.address, CLINIC.web].map(t => <span key={t} style={{ fontSize: 6.5, color: '#AAA', letterSpacing: 0.3 }}>{t}</span>)}
        </div>
        <div style={{ fontSize: 5.5, color: '#AAA', textAlign: 'center' }}>This is a computer-generated prescription</div>
      </div>
      <div style={{ height: 16 }} />
    </Paper>
  )
}

// ── Clinical ──────────────────────────────────────────────────────────────────

function ClinicalPreview({ dr, spec }: { dr: string; spec: string }) {
  return (
    <Paper>
      <div style={{ padding: '20px 24px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1B5E20', letterSpacing: 0.2, marginBottom: 2 }}>{dr}</div>
            <div style={{ fontSize: 8, color: '#616161', lineHeight: 1.4 }}>{spec}</div>
            <div style={{ fontSize: 8, color: '#616161' }}>{""}</div>
          </div>
          <div style={{ background: '#E8F5E9', border: '0.5px solid #A5D6A7', borderRadius: 3, padding: '4px 8px' }}>
            <div style={{ fontSize: 6, color: '#1B5E20', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 }}>Date</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#1B5E20' }}>{DATE}</div>
          </div>
        </div>
        <div style={{ borderBottom: '2px solid #1B5E20', marginBottom: 12 }} />
      </div>

      <div style={{ margin: '0 24px 12px', border: '0.75px solid #9E9E9E', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '0.5px solid #9E9E9E' }}>
          {([['Patient Name', PATIENT_NAME], ['Age / Gender', PATIENT_AGE], ['MR No.', MR]] as [string, string][]).map(([l, v], i, arr) => (
            <div key={l} style={{ flex: 1, padding: '5px 8px', borderRight: i < arr.length - 1 ? '0.5px solid #9E9E9E' : 'none' }}>
              <div style={{ fontSize: 6.5, color: '#616161', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 9.5, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex' }}>
          {([['Phone', PATIENT_PHONE], ['Visit Date', DATE]] as [string, string][]).map(([l, v], i, arr) => (
            <div key={l} style={{ flex: 1, padding: '5px 8px', borderRight: i < arr.length - 1 ? '0.5px solid #9E9E9E' : 'none' }}>
              <div style={{ fontSize: 6.5, color: '#616161', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>{l}</div>
              <div style={{ fontSize: 9.5, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ margin: '0 24px 12px', background: '#FFEBEE', border: '0.75px solid #EF9A9A', borderRadius: 2, padding: '5px 8px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ background: '#C62828', color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 4px', borderRadius: 2 }}>!</span>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#C62828' }}>ALLERGIES: {ALLERGY}</span>
      </div>

      <div style={{ margin: '0 24px 10px' }}>
        <div style={{ fontSize: 8.5, fontWeight: 700, color: '#fff', background: '#1B5E20', padding: '4px 8px', borderRadius: '2px 2px 0 0' }}>Diagnosis</div>
        <div style={{ padding: '6px 8px', border: '0.5px solid #9E9E9E', borderTop: 'none', borderRadius: '0 0 2px 2px' }}>
          <div style={{ fontSize: 9.5, lineHeight: 1.55 }}>{DIAG}</div>
        </div>
      </div>

      <div style={{ margin: '0 24px 10px' }}>
        <div style={{ fontSize: 8.5, fontWeight: 700, color: '#fff', background: '#1B5E20', padding: '4px 8px', borderRadius: '2px 2px 0 0' }}>Prescribed Medications (Rx)</div>
        <div style={{ border: '0.5px solid #9E9E9E', borderTop: 'none', borderRadius: '0 0 2px 2px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', background: '#F5F5F5', borderBottom: '0.5px solid #9E9E9E' }}>
            {(['#', 'Medicine', 'Dose', 'Frequency', 'Days'] as string[]).map((h, i) => (
              <div key={h} style={{ padding: '3px 6px', fontSize: 7, fontWeight: 700, color: '#616161', textTransform: 'uppercase', letterSpacing: 0.4, flex: i === 1 ? 1 : undefined, width: i === 0 ? 22 : i === 2 ? 50 : i === 3 ? 82 : 40, borderRight: i < 4 ? '0.5px solid #9E9E9E' : 'none' }}>{h}</div>
            ))}
          </div>
          {MEDS.map((m, i) => (
            <div key={i} style={{ display: 'flex', background: i % 2 === 1 ? '#FAFAFA' : '#fff', borderBottom: i < MEDS.length - 1 ? '0.5px solid #9E9E9E' : 'none' }}>
              <div style={{ width: 22, padding: '4px 6px', fontSize: 9, fontWeight: 700, color: '#1B5E20', borderRight: '0.5px solid #9E9E9E' }}>{i + 1}</div>
              <div style={{ flex: 1, padding: '4px 6px', fontSize: 9, fontWeight: 700, borderRight: '0.5px solid #9E9E9E' }}>{m.n}</div>
              <div style={{ width: 50, padding: '4px 6px', fontSize: 9, borderRight: '0.5px solid #9E9E9E' }}>1 tab</div>
              <div style={{ width: 82, padding: '4px 6px', fontSize: 9, borderRight: '0.5px solid #9E9E9E' }}>{m.d.split('·')[1]?.trim()}</div>
              <div style={{ width: 40, padding: '4px 6px', fontSize: 9 }}>{m.d.split('·')[2]?.replace('days', '').trim()}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ margin: '0 24px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {TESTS.map(t => <span key={t} style={{ fontSize: 8, fontWeight: 700, color: '#1B5E20', background: '#E8F5E9', padding: '3px 8px', borderRadius: 3, border: '0.5px solid #A5D6A7' }}>{t}</span>)}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '12px 24px 8px' }}>
        <span style={{ fontSize: 8, color: '#616161' }}>Follow-up:</span>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#1B5E20' }}>{FOLLOW_UP}</span>
      </div>

      <div style={{ padding: '0 24px 6px', display: 'flex', justifyContent: 'flex-end' }}>
        <div>
          <div style={{ width: 155, borderBottom: '0.5px solid #9E9E9E', marginBottom: 4 }} />
          <div style={{ fontSize: 7.5, color: '#616161' }}>{dr}</div>
        </div>
      </div>

      <div style={{ borderTop: '1.5px solid #1B5E20', margin: '0 24px', padding: '7px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          {[CLINIC.phone, CLINIC.address, CLINIC.web].map(t => <span key={t} style={{ fontSize: 7, color: '#616161' }}>{t}</span>)}
        </div>
        <div style={{ fontSize: 6, color: '#616161', textAlign: 'center' }}>This is a computer-generated prescription</div>
      </div>
      <div style={{ height: 8 }} />
    </Paper>
  )
}

// ── Elegant ───────────────────────────────────────────────────────────────────

function ElegantPreview({ dr, spec }: { dr: string; spec: string }) {
  return (
    <Paper>
      <div style={{ padding: '0 36px' }}>
        <div style={{ borderBottom: '2.5px solid #1A5276', paddingTop: 28 }} />
        <div style={{ borderBottom: '0.5px solid #1A5276', marginTop: 2.5, marginBottom: 0 }} />
      </div>

      <div style={{ padding: '16px 36px 4px' }}>
        <div style={{ fontSize: 23, fontWeight: 700, color: '#1A5276', fontFamily: 'Georgia, Times New Roman, serif', letterSpacing: 0.5, marginBottom: 4 }}>{dr}</div>
        <div style={{ fontSize: 9, color: '#7F8C8D', lineHeight: 1.5 }}>{spec}</div>
        <div style={{ fontSize: 8, color: '#7F8C8D', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 3 }}>{""}</div>
      </div>

      <div style={{ borderBottom: '0.5px solid #BDC3C7', margin: '12px 36px' }} />

      <div style={{ padding: '0 36px', display: 'flex', flexWrap: 'wrap', gap: 28 }}>
        {([['Patient', PATIENT_NAME], ['Age', PATIENT_AGE.split('/')[0]!.trim()], ['Gender', 'Male'], ['Phone', PATIENT_PHONE], ['MR No.', MR], ['Date', DATE]] as [string, string][]).map(([l, v]) => (
          <div key={l}>
            <div style={{ fontSize: 7, color: '#7F8C8D', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>{l}</div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#2C3E50' }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ margin: '10px 36px 0', borderLeft: '3px solid #C0392B', background: '#FDEDEC', borderRadius: 2, padding: '5px 10px', display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 7, fontWeight: 700, color: '#C0392B', textTransform: 'uppercase', letterSpacing: 0.6 }}>Allergies:</span>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: '#C0392B' }}>{ALLERGY}</span>
      </div>

      <div style={{ borderBottom: '0.5px solid #BDC3C7', margin: '12px 36px' }} />

      <div style={{ display: 'flex', flex: 1, padding: '0 36px' }}>
        <div style={{ width: '33%', paddingRight: 18, borderRight: '0.5px solid #BDC3C7' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#1A5276', fontFamily: 'Georgia, Times New Roman, serif', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>Diagnosis</div>
          <div style={{ fontSize: 10, color: '#2C3E50', lineHeight: 1.7, marginBottom: 16 }}>{DIAG}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#1A5276', fontFamily: 'Georgia, Times New Roman, serif', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>Problem List</div>
          <div style={{ fontSize: 10, color: '#2C3E50', lineHeight: 1.7 }}>{PROBLEMS}</div>
        </div>

        <div style={{ flex: 1, paddingLeft: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 24, fontFamily: 'Georgia, Times New Roman, serif', fontStyle: 'italic', fontWeight: 700, color: '#1A5276', lineHeight: 1 }}>Rx</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#1A5276', fontFamily: 'Georgia, Times New Roman, serif', textTransform: 'uppercase', letterSpacing: 0.7 }}>Prescribed Medications</span>
          </div>
          {MEDS.map((m, i) => (
            <div key={i} style={{ marginBottom: 11, paddingLeft: 8, borderLeft: '2px solid #AED6F1' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2C3E50', marginBottom: 2 }}>{i + 1}. {m.n}</div>
              <div style={{ fontSize: 8.5, color: '#7F8C8D' }}>{m.d}</div>
            </div>
          ))}
          <div style={{ background: '#EAF2F8', padding: '7px 10px', borderRadius: 3, marginTop: 12 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#1A5276', fontFamily: 'Georgia, Times New Roman, serif', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Advice</div>
            <div style={{ fontSize: 9.5, color: '#2C3E50', lineHeight: 1.65 }}>{NOTES}</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
            {TESTS.map(t => <span key={t} style={{ fontSize: 8, color: '#1A5276', background: '#EAF2F8', padding: '3px 8px', borderRadius: 3, border: '0.5px solid #AED6F1' }}>{t}</span>)}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: '0.5px solid #BDC3C7' }}>
            <span style={{ fontSize: 8.5, color: '#7F8C8D' }}>Follow-up:</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#1A5276' }}>{FOLLOW_UP}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 36px 6px', display: 'flex', justifyContent: 'flex-end' }}>
        <div>
          <div style={{ width: 170, borderBottom: '0.5px solid #BDC3C7', marginBottom: 4 }} />
          <div style={{ fontSize: 8.5, color: '#7F8C8D', fontFamily: 'Georgia, Times New Roman, serif', fontStyle: 'italic' }}>{dr}</div>
        </div>
      </div>

      <div style={{ padding: '0 36px' }}>
        <div style={{ borderBottom: '0.5px solid #1A5276', marginBottom: 2.5 }} />
        <div style={{ borderBottom: '2.5px solid #1A5276' }} />
      </div>

      <div style={{ padding: '7px 36px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          {[CLINIC.phone, CLINIC.address, CLINIC.web].map(t => <span key={t} style={{ fontSize: 7, color: '#7F8C8D', letterSpacing: 0.2 }}>{t}</span>)}
        </div>
        <div style={{ fontSize: 5.5, color: '#7F8C8D', textAlign: 'center' }}>This is a computer-generated prescription</div>
      </div>
    </Paper>
  )
}

// ── Compact ───────────────────────────────────────────────────────────────────

function CompactPreview({ dr, spec }: { dr: string; spec: string }) {
  return (
    <Paper>
      <div style={{ padding: '14px 22px 6px', borderBottom: '1.5px solid #4A148C', marginBottom: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4A148C', letterSpacing: 0.2, marginBottom: 1 }}>{dr}</div>
            <div style={{ fontSize: 7.5, color: '#666' }}>{spec}</div>
          </div>
          <div style={{ background: '#F3E5F5', padding: '3px 6px', borderRadius: 2 }}>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: '#4A148C' }}>{DATE}</div>
          </div>
        </div>
      </div>

      <div style={{ margin: '0 22px 6px', background: '#F3E5F5', borderRadius: 2, padding: '5px 8px', display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        {([['Name', PATIENT_NAME], ['Age', PATIENT_AGE], ['Phone', PATIENT_PHONE], ['MR#', MR]] as [string, string][]).map(([l, v]) => (
          <div key={l} style={{ display: 'flex', gap: 3 }}>
            <span style={{ fontSize: 7.5, color: '#666' }}>{l}:</span>
            <span style={{ fontSize: 7.5, fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ margin: '0 22px 6px', background: '#FFEBEE', border: '0.5px solid #EF9A9A', borderRadius: 2, padding: '4px 8px', display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ background: '#C62828', color: '#fff', fontSize: 6.5, fontWeight: 700, padding: '1px 4px', borderRadius: 2 }}>!</span>
        <span style={{ fontSize: 8, fontWeight: 700, color: '#C62828' }}>{ALLERGY}</span>
      </div>

      <div style={{ display: 'flex', flex: 1, padding: '0 22px' }}>
        <div style={{ width: '30%', paddingRight: 10 }}>
          <span style={{ display: 'inline-block', fontSize: 6.5, fontWeight: 700, color: '#fff', background: '#4A148C', padding: '2px 5px', borderRadius: 2, marginBottom: 4 }}>DIAGNOSIS</span>
          <div style={{ fontSize: 8.5, lineHeight: 1.5, marginBottom: 10 }}>{DIAG}</div>
          <span style={{ display: 'inline-block', fontSize: 6.5, fontWeight: 700, color: '#fff', background: '#4A148C', padding: '2px 5px', borderRadius: 2, marginBottom: 4 }}>PROBLEMS</span>
          <div style={{ fontSize: 8.5, lineHeight: 1.5, marginBottom: 10 }}>{PROBLEMS}</div>
          <span style={{ display: 'inline-block', fontSize: 6.5, fontWeight: 700, color: '#fff', background: '#4A148C', padding: '2px 5px', borderRadius: 2, marginBottom: 4 }}>ADVICE</span>
          <div style={{ fontSize: 8.5, lineHeight: 1.5, marginBottom: 10 }}>{NOTES}</div>
          <span style={{ display: 'inline-block', fontSize: 6.5, fontWeight: 700, color: '#fff', background: '#4A148C', padding: '2px 5px', borderRadius: 2, marginBottom: 4 }}>TESTS</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {TESTS.map(t => <span key={t} style={{ fontSize: 7, fontWeight: 700, color: '#4A148C', background: '#F3E5F5', padding: '2px 5px', borderRadius: 2 }}>{t}</span>)}
          </div>
        </div>

        <div style={{ flex: 1, paddingLeft: 10, borderLeft: '0.5px solid #BDBDBD' }}>
          <div style={{ fontSize: 8.5, fontWeight: 700, color: '#4A148C', marginBottom: 6 }}>Rx — Medications</div>
          {MEDS.map((m, i) => (
            <div key={i} style={{ display: 'flex', marginBottom: 5, gap: 4 }}>
              <span style={{ fontSize: 7.5, fontWeight: 700, color: '#4A148C', width: 14, flexShrink: 0 }}>{i + 1}.</span>
              <div>
                <div style={{ fontSize: 8.5, fontWeight: 700, marginBottom: 1 }}>{m.n}</div>
                <div style={{ fontSize: 7, color: '#666' }}>{m.d}</div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 7, color: '#666' }}>Follow-up:</span>
            <span style={{ fontSize: 8.5, fontWeight: 700, color: '#4A148C' }}>{FOLLOW_UP}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '8px 22px 4px', display: 'flex', justifyContent: 'flex-end' }}>
        <div>
          <div style={{ width: 120, borderBottom: '0.5px solid #BDBDBD', marginBottom: 3 }} />
          <div style={{ fontSize: 7, color: '#666' }}>{dr}</div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #4A148C', margin: '0 22px', padding: '4px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
          {[CLINIC.phone, CLINIC.address, CLINIC.web].map(t => <span key={t} style={{ fontSize: 6.5, color: '#666' }}>{t}</span>)}
        </div>
        <div style={{ fontSize: 5.5, color: '#666', textAlign: 'center' }}>This is a computer-generated prescription</div>
      </div>
      <div style={{ height: 10 }} />
    </Paper>
  )
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

const PREVIEWS: Record<string, React.ComponentType<{ dr: string; spec: string }>> = {
  classic: ClassicPreview,
  modern: ModernPreview,
  minimal: MinimalPreview,
  clinical: ClinicalPreview,
  elegant: ElegantPreview,
  compact: CompactPreview,
}

export function TemplatePreview({ templateId, doctorName, specialization }: { templateId: string; doctorName?: string; specialization?: string }) {
  const Preview = PREVIEWS[templateId] ?? ClassicPreview
  return <Preview dr={doctorName || DR_FALLBACK} spec={specialization || `${CRED_FALLBACK} · ${SPEC_FALLBACK}`} />
}
