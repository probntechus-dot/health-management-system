/**
 * Classic — Traditional medical letterhead. Serif doctor name, two-column body,
 * formal navy ink, thin vertical rule. The prescription your senior professor uses.
 */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatMrn } from '@/lib/utils'
import type { PrescriptionTemplateProps, TemplateMetadata } from './index'
import {
  formatDate, today, fmtDr, filledMeds, buildUrduLine,
  medDisplayName, FOLLOW_UP_URDU, DISCLAIMER,
} from './_shared'

export const metadata: TemplateMetadata = {
  id: 'classic',
  name: 'Classic',
  description: 'Traditional letterhead with serif headings, two-column layout, and formal tone.',
  thumbnail: '/templates/classic.svg',
}

const NAVY = '#1B3A5C'
const INK = '#1A1A1A'
const MUTED = '#5A6575'
const LIGHT = '#8A95A5'
const RULE = '#C5CDD8'
const BG_SUBTLE = '#F5F7FA'
const ALLERGY_RED = '#DC2626'
const ALLERGY_BG = '#FEF2F2'
const ALLERGY_BORDER = '#FCA5A5'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: INK, backgroundColor: '#FFFFFF', paddingBottom: 0 },

  topBar: { height: 3.5, backgroundColor: NAVY },

  letterhead: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 32, paddingTop: 22, paddingBottom: 16 },
  hLeft: { flex: 1, paddingRight: 20 },
  hRight: { width: 190 },

  drName: { fontSize: 20, fontFamily: 'Times-Bold', color: NAVY, marginBottom: 3, letterSpacing: 0.4 },
  credential: { fontSize: 8.5, color: MUTED, lineHeight: 1.5 },
  specialty: { fontSize: 7.5, color: LIGHT, textTransform: 'uppercase' as const, letterSpacing: 1.2, marginTop: 3 },

  patientRow: { flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' },
  patientLabel: { fontSize: 8.5, color: LIGHT, width: 40, flexShrink: 0 },
  patientValue: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: INK, flex: 1 },

  divider: { height: 0.75, backgroundColor: RULE, marginHorizontal: 32 },

  allergyBanner: {
    marginHorizontal: 32, marginTop: 12, marginBottom: 4,
    backgroundColor: ALLERGY_BG, borderWidth: 0.75, borderColor: ALLERGY_BORDER,
    borderRadius: 3, paddingHorizontal: 10, paddingVertical: 6,
    flexDirection: 'row', gap: 6, alignItems: 'center',
  },
  allergyLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: ALLERGY_RED, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  allergyText: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: ALLERGY_RED, flex: 1 },

  body: { flexDirection: 'row', flex: 1, paddingHorizontal: 32, paddingTop: 14 },
  leftPanel: { width: '32%', paddingRight: 16 },
  vertRule: { width: 0.5, backgroundColor: RULE },
  rightPanel: { width: '68%', paddingLeft: 20 },

  sectionBlock: { marginBottom: 16 },
  sectionHeading: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: NAVY, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 5 },
  sectionText: { fontSize: 10, color: INK, lineHeight: 1.65 },

  rxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  rxSymbol: { fontSize: 24, fontFamily: 'Times-BoldItalic', color: NAVY },
  rxTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: NAVY, textTransform: 'uppercase' as const, letterSpacing: 1 },

  medItem: { marginBottom: 11, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: RULE },
  medItemLast: { marginBottom: 11 },
  medNum: { fontSize: 8, color: LIGHT, marginBottom: 2 },
  medName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: INK, marginBottom: 2 },
  medDetail: { fontSize: 8.5, color: MUTED, letterSpacing: 0.2 },
  urduLine: { fontFamily: 'NotoNaskhArabic', fontSize: 9.5, color: '#444444', marginTop: 2 },

  adviceBox: { backgroundColor: BG_SUBTLE, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 3, marginTop: 14 },
  adviceLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: NAVY, textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 4 },
  adviceText: { fontSize: 9.5, color: INK, lineHeight: 1.65 },

  testsBlock: { marginTop: 14, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: RULE },
  testsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  testChip: { fontSize: 8.5, color: NAVY, backgroundColor: BG_SUBTLE, paddingHorizontal: 8, paddingVertical: 3.5, borderRadius: 3, borderWidth: 0.5, borderColor: RULE },

  followUpRow: { marginTop: 14, flexDirection: 'row', gap: 6, alignItems: 'center' },
  followUpLabel: { fontSize: 9, color: MUTED },
  followUpDate: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: NAVY },

  sigArea: { marginTop: 'auto', paddingHorizontal: 32, paddingBottom: 8, alignItems: 'flex-end' },
  sigLine: { width: 170, borderBottomWidth: 0.5, borderBottomColor: RULE, marginBottom: 4 },
  sigName: { fontSize: 8.5, color: MUTED, fontFamily: 'Times-Italic' },

  footer: { borderTopWidth: 0.75, borderTopColor: RULE, marginHorizontal: 32, paddingTop: 8, paddingBottom: 6 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  footerText: { fontSize: 7, color: LIGHT },
  disclaimer: { fontSize: 6, color: LIGHT, textAlign: 'center', marginTop: 2 },

  bottomBar: { height: 3.5, backgroundColor: NAVY },
})

export function ClassicTemplate({
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
        <View style={s.topBar} />

        <View style={s.letterhead}>
          <View style={s.hLeft}>
            <Text style={s.drName}>{fmtDr(doctorName)}</Text>
            {doctorCredentials ? <Text style={s.credential}>{doctorCredentials}</Text> : null}
            {doctorSpecialty ? <Text style={s.specialty}>{doctorSpecialty}</Text> : null}
          </View>
          <View style={s.hRight}>
            {([
              ['Name', visit.patient_name],
              ['Age', `${visit.patient_age} yrs  /  ${visit.patient_gender}`],
              ['Phone', visit.patient_contact || '\u2014'],
              ['MR #', formatMrn(visit.patient_mrn)],
              ['Date', today()],
            ] as [string, string][]).map(([l, v]) => (
              <View key={l} style={s.patientRow}>
                <Text style={s.patientLabel}>{l}</Text>
                <Text style={s.patientValue}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.divider} />

        {hasAllergies ? (
          <View style={s.allergyBanner}>
            <Text style={s.allergyLabel}>Allergies:</Text>
            <Text style={s.allergyText}>{allergies.trim()}</Text>
          </View>
        ) : null}

        <View style={s.body}>
          <View style={s.leftPanel}>
            {diagnosis.trim() ? (
              <View style={s.sectionBlock}>
                <Text style={s.sectionHeading}>Diagnosis</Text>
                <Text style={s.sectionText}>{diagnosis.trim()}</Text>
              </View>
            ) : null}
            {problemList.trim() ? (
              <View style={s.sectionBlock}>
                <Text style={s.sectionHeading}>Problem List</Text>
                <Text style={s.sectionText}>{problemList.trim()}</Text>
              </View>
            ) : null}
          </View>

          <View style={s.vertRule} />

          <View style={s.rightPanel}>
            {meds.length > 0 ? (
              <>
                <View style={s.rxHeader}>
                  <Text style={s.rxSymbol}>Rx</Text>
                  <Text style={s.rxTitle}>Prescribed Medications</Text>
                </View>
                {meds.map((row, i) => {
                  const urdu = buildUrduLine(row)
                  return (
                    <View key={row.id} style={i < meds.length - 1 ? s.medItem : s.medItemLast}>
                      <Text style={s.medNum}>({i + 1})</Text>
                      <Text style={s.medName}>{medDisplayName(row)}</Text>
                      <Text style={s.medDetail}>
                        {[row.dosage && `Dose: ${row.dosage}`, row.frequency, row.duration && `${row.duration} days`].filter(Boolean).join('  \u00B7  ')}
                      </Text>
                      {urdu ? <Text style={[s.urduLine, { fontFamily: urduFontFamily }]}>{urdu}</Text> : null}
                    </View>
                  )
                })}
              </>
            ) : null}

            {notes.trim() ? (
              <View style={s.adviceBox}>
                <Text style={s.adviceLabel}>Advice</Text>
                <Text style={s.adviceText}>{notes.trim()}</Text>
              </View>
            ) : null}

            {suggestedTests && suggestedTests.length > 0 ? (
              <View style={s.testsBlock}>
                <Text style={[s.sectionHeading, { marginBottom: 6 }]}>Suggested Tests</Text>
                <View style={s.testsGrid}>
                  {suggestedTests.map((t, i) => <Text key={i} style={s.testChip}>{t}</Text>)}
                </View>
              </View>
            ) : null}

            {followUpDate ? (
              <View style={s.followUpRow}>
                <Text style={[s.followUpLabel, { fontFamily: urduFontFamily }]}>{FOLLOW_UP_URDU}</Text>
                <Text style={s.followUpDate}>{formatDate(followUpDate)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={s.sigArea}>
          <View style={s.sigLine} />
          <Text style={s.sigName}>{fmtDr(doctorName)}</Text>
        </View>

        <View style={s.footer}>
          <View style={s.footerRow}>
            <Text style={s.footerText}>{clinicPhone || ''}</Text>
            <Text style={s.footerText}>{clinicAddress || ''}</Text>
            <Text style={s.footerText}>{clinicWebsite || ''}</Text>
          </View>
          <Text style={s.disclaimer}>{DISCLAIMER}</Text>
        </View>

        <View style={s.bottomBar} />
      </Page>
    </Document>
  )
}
