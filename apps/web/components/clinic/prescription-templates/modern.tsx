/**
 * Modern — Contemporary digital-health aesthetic. Full-width blue header,
 * card-style medications with accent bars, pill-shaped badges.
 * For the tech-forward urban specialist.
 */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatMrn } from '@/lib/utils'
import type { PrescriptionTemplateProps, TemplateMetadata } from './index'
import {
  formatDate, today, fmtDr, filledMeds, buildUrduLine,
  medDisplayName, medDetailLine, FOLLOW_UP_URDU, DISCLAIMER,
} from './_shared'

export const metadata: TemplateMetadata = {
  id: 'modern',
  name: 'Modern',
  description: 'Bold blue header, card-style medicines, and clean contemporary layout.',
  thumbnail: '/templates/modern.svg',
}

const BLUE = '#1565C0'
const BLUE_DARK = '#0D47A1'
const BLUE_LIGHT = '#E3F2FD'
const BLUE_MID = '#BBDEFB'
const TEXT = '#212121'
const MUTED = '#616161'
const RULE = '#E0E0E0'
const ALLERGY_RED = '#C62828'
const ALLERGY_BG = '#FFEBEE'
const ALLERGY_BORDER = '#EF9A9A'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: TEXT, backgroundColor: '#FFFFFF', paddingBottom: 0 },

  header: { backgroundColor: BLUE, paddingHorizontal: 32, paddingTop: 22, paddingBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  drName: { fontSize: 21, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', marginBottom: 3, letterSpacing: 0.3 },
  drSub: { fontSize: 8.5, color: '#B3D4FC', lineHeight: 1.5 },
  headerDateBlock: { alignItems: 'flex-end' },
  headerDateLabel: { fontSize: 7, color: '#90CAF9', textTransform: 'uppercase' as const, letterSpacing: 0.6, marginBottom: 2 },
  headerDate: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },

  patientBar: {
    backgroundColor: BLUE_LIGHT, paddingHorizontal: 32, paddingVertical: 10,
    flexDirection: 'row', flexWrap: 'wrap', gap: 20,
    borderBottomWidth: 1, borderBottomColor: BLUE_MID,
  },
  patientItem: { flexDirection: 'row', gap: 4 },
  patientLabel: { fontSize: 8, color: MUTED },
  patientValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: TEXT },

  allergyStrip: {
    backgroundColor: ALLERGY_BG, borderBottomWidth: 1, borderBottomColor: ALLERGY_BORDER,
    paddingHorizontal: 32, paddingVertical: 7,
    flexDirection: 'row', gap: 8, alignItems: 'center',
  },
  allergyTag: {
    backgroundColor: ALLERGY_RED, borderRadius: 3,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  allergyTagText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', textTransform: 'uppercase' as const, letterSpacing: 0.4 },
  allergyText: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: ALLERGY_RED, flex: 1 },

  body: { paddingHorizontal: 32, paddingTop: 18, flex: 1 },

  sectionTitle: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: BLUE, marginBottom: 6, marginTop: 16, letterSpacing: 0.2 },
  sectionTitleFirst: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: BLUE, marginBottom: 6, letterSpacing: 0.2 },
  sectionText: { fontSize: 10, color: TEXT, lineHeight: 1.65, marginBottom: 4 },

  rxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 10 },
  rxCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: BLUE,
    justifyContent: 'center', alignItems: 'center',
  },
  rxText: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#FFFFFF' },
  rxLabel: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: BLUE, letterSpacing: 0.2 },

  medCard: { flexDirection: 'row', marginBottom: 8, borderWidth: 0.5, borderColor: RULE, borderRadius: 4, overflow: 'hidden' },
  medIndex: { width: 30, backgroundColor: BLUE_LIGHT, justifyContent: 'center', alignItems: 'center' },
  medIndexText: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BLUE },
  medAccent: { width: 3, backgroundColor: BLUE },
  medBody: { flex: 1, paddingHorizontal: 10, paddingVertical: 8 },
  medName: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: TEXT, marginBottom: 2 },
  medDetail: { fontSize: 8.5, color: MUTED },
  urduLine: { fontFamily: 'NotoNaskhArabic', fontSize: 9, color: '#424242', marginTop: 2 },

  testsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  testChip: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: BLUE_DARK, backgroundColor: BLUE_LIGHT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },

  followUp: { marginTop: 16, flexDirection: 'row', gap: 6, alignItems: 'center' },
  followUpLabel: { fontSize: 9, color: MUTED },
  followUpDate: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: BLUE },

  sigArea: { marginTop: 'auto', paddingHorizontal: 32, paddingBottom: 10, alignItems: 'flex-end' },
  sigLine: { width: 160, borderBottomWidth: 0.5, borderBottomColor: '#BDBDBD', marginBottom: 4 },
  sigText: { fontSize: 8, color: MUTED },

  footer: {
    backgroundColor: BLUE_LIGHT, paddingHorizontal: 32, paddingVertical: 8,
    borderTopWidth: 2, borderTopColor: BLUE,
  },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  footerText: { fontSize: 7.5, color: MUTED },
  disclaimer: { fontSize: 6, color: MUTED, textAlign: 'center', marginTop: 2 },
})

export function ModernTemplate({
  visit, diagnosis, problemList, medicines, notes, allergies,
  followUpDate, suggestedTests, urduFontFamily = 'NotoNaskhArabic',
  doctorName, doctorSpecialty, doctorCredentials,
  clinicPhone, clinicAddress, clinicWebsite,
}: PrescriptionTemplateProps) {
  const meds = filledMeds(medicines)
  const hasAllergies = allergies.trim().length > 0

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.drName}>{fmtDr(doctorName)}</Text>
            {doctorCredentials ? <Text style={s.drSub}>{doctorCredentials}</Text> : null}
            {doctorSpecialty ? <Text style={s.drSub}>{doctorSpecialty}</Text> : null}
          </View>
          <View style={s.headerDateBlock}>
            <Text style={s.headerDateLabel}>Date</Text>
            <Text style={s.headerDate}>{today()}</Text>
          </View>
        </View>

        <View style={s.patientBar}>
          {([
            ['Patient', visit.patient_name],
            ['Age', `${visit.patient_age} / ${visit.patient_gender}`],
            ['Phone', visit.patient_contact || '\u2014'],
            ['MR #', formatMrn(visit.patient_mrn)],
          ] as [string, string][]).map(([l, v]) => (
            <View key={l} style={s.patientItem}>
              <Text style={s.patientLabel}>{l}:</Text>
              <Text style={s.patientValue}>{v}</Text>
            </View>
          ))}
        </View>

        {hasAllergies ? (
          <View style={s.allergyStrip}>
            <View style={s.allergyTag}>
              <Text style={s.allergyTagText}>Allergy</Text>
            </View>
            <Text style={s.allergyText}>{allergies.trim()}</Text>
          </View>
        ) : null}

        <View style={s.body}>
          {diagnosis.trim() ? (
            <>
              <Text style={s.sectionTitleFirst}>Diagnosis</Text>
              <Text style={s.sectionText}>{diagnosis.trim()}</Text>
            </>
          ) : null}

          {problemList.trim() ? (
            <>
              <Text style={s.sectionTitle}>Problem List</Text>
              <Text style={s.sectionText}>{problemList.trim()}</Text>
            </>
          ) : null}

          {meds.length > 0 ? (
            <>
              <View style={s.rxRow}>
                <View style={s.rxCircle}>
                  <Text style={s.rxText}>Rx</Text>
                </View>
                <Text style={s.rxLabel}>Prescribed Medications</Text>
              </View>
              {meds.map((row, i) => {
                const urdu = buildUrduLine(row)
                return (
                  <View key={row.id} style={s.medCard}>
                    <View style={s.medIndex}>
                      <Text style={s.medIndexText}>{i + 1}</Text>
                    </View>
                    <View style={s.medAccent} />
                    <View style={s.medBody}>
                      <Text style={s.medName}>{medDisplayName(row)}</Text>
                      <Text style={s.medDetail}>{medDetailLine(row)}</Text>
                      {urdu ? <Text style={[s.urduLine, { fontFamily: urduFontFamily }]}>{urdu}</Text> : null}
                    </View>
                  </View>
                )
              })}
            </>
          ) : null}

          {notes.trim() ? (
            <>
              <Text style={s.sectionTitle}>Advice</Text>
              <Text style={s.sectionText}>{notes.trim()}</Text>
            </>
          ) : null}

          {suggestedTests && suggestedTests.length > 0 ? (
            <>
              <Text style={s.sectionTitle}>Suggested Tests</Text>
              <View style={s.testsRow}>
                {suggestedTests.map((t, i) => <Text key={i} style={s.testChip}>{t}</Text>)}
              </View>
            </>
          ) : null}

          {followUpDate ? (
            <View style={s.followUp}>
              <Text style={[s.followUpLabel, { fontFamily: urduFontFamily }]}>{FOLLOW_UP_URDU}</Text>
              <Text style={s.followUpDate}>{formatDate(followUpDate)}</Text>
            </View>
          ) : null}
        </View>

        <View style={s.sigArea}>
          <View style={s.sigLine} />
          <Text style={s.sigText}>{fmtDr(doctorName)}</Text>
        </View>

        <View style={s.footer}>
          <View style={s.footerRow}>
            <Text style={s.footerText}>{clinicPhone || ''}</Text>
            <Text style={s.footerText}>{clinicAddress || ''}</Text>
            <Text style={s.footerText}>{clinicWebsite || ''}</Text>
          </View>
          <Text style={s.disclaimer}>{DISCLAIMER}</Text>
        </View>
      </Page>
    </Document>
  )
}
