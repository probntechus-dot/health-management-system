/**
 * Minimal — Swiss International Typographic Style. Pure B&W, maximum whitespace,
 * hairline rules, small-caps labels, generous margins. For the design-conscious specialist.
 */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatMrn } from '@/lib/utils'
import type { PrescriptionTemplateProps, TemplateMetadata } from './index'
import {
  formatDate, today, fmtDr, filledMeds, buildUrduLine,
  medDisplayName, FOLLOW_UP_URDU, DISCLAIMER,
} from './_shared'

export const metadata: TemplateMetadata = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Swiss-inspired B&W with generous whitespace and understated typography.',
  thumbnail: '/templates/minimal.svg',
}

const BLK = '#111111'
const DARK = '#333333'
const GREY = '#777777'
const LIGHT = '#AAAAAA'
const HAIRLINE = '#D5D5D5'
const ALLERGY_RED = '#B91C1C'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: BLK, backgroundColor: '#FFFFFF', paddingHorizontal: 52, paddingTop: 52, paddingBottom: 32 },

  header: { marginBottom: 6 },
  drName: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: BLK, marginBottom: 3, letterSpacing: 0.6 },
  drSub: { fontSize: 8, color: GREY, lineHeight: 1.5 },

  heavyRule: { borderBottomWidth: 1.5, borderBottomColor: BLK, marginVertical: 18 },
  thinRule: { borderBottomWidth: 0.5, borderBottomColor: HAIRLINE, marginVertical: 16 },

  patientRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 32, marginBottom: 4 },
  patientItem: {},
  pLabel: { fontSize: 6.5, color: GREY, textTransform: 'uppercase' as const, letterSpacing: 1.4, marginBottom: 2 },
  pValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: BLK },

  allergyBox: {
    borderWidth: 1, borderColor: ALLERGY_RED, borderRadius: 2,
    paddingHorizontal: 10, paddingVertical: 6, marginTop: 14,
    flexDirection: 'row', gap: 6, alignItems: 'center',
  },
  allergyLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: ALLERGY_RED, textTransform: 'uppercase' as const, letterSpacing: 1 },
  allergyText: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: ALLERGY_RED, flex: 1 },

  sectionLabel: { fontSize: 6.5, color: GREY, textTransform: 'uppercase' as const, letterSpacing: 1.4, marginBottom: 6, marginTop: 22 },
  sectionLabelFirst: { fontSize: 6.5, color: GREY, textTransform: 'uppercase' as const, letterSpacing: 1.4, marginBottom: 6 },
  sectionText: { fontSize: 10, color: BLK, lineHeight: 1.7, marginBottom: 2 },

  medRow: { marginBottom: 14 },
  medName: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: BLK, marginBottom: 2 },
  medDetail: { fontSize: 8.5, color: DARK, letterSpacing: 0.2 },
  urduLine: { fontFamily: 'NotoNaskhArabic', fontSize: 9, color: '#555555', marginTop: 2 },

  testsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  testChip: { fontSize: 7.5, color: BLK, borderWidth: 0.5, borderColor: LIGHT, paddingHorizontal: 8, paddingVertical: 3.5, borderRadius: 2, letterSpacing: 0.3 },

  followUp: { marginTop: 22, flexDirection: 'row', gap: 6, alignItems: 'center' },
  followUpLabel: { fontSize: 6.5, color: GREY, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  followUpDate: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: BLK },

  sigArea: { marginTop: 'auto', paddingBottom: 10, alignItems: 'flex-end' },
  sigLine: { width: 150, borderBottomWidth: 0.5, borderBottomColor: LIGHT, marginBottom: 4 },
  sigText: { fontSize: 7.5, color: GREY },

  footer: { borderTopWidth: 0.5, borderTopColor: HAIRLINE, paddingTop: 10, flexDirection: 'column', gap: 3 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 6.5, color: LIGHT, letterSpacing: 0.3 },
  disclaimer: { fontSize: 5.5, color: LIGHT, textAlign: 'center', marginTop: 2 },
})

export function MinimalTemplate({
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
          <Text style={s.drName}>{fmtDr(doctorName)}</Text>
          {doctorCredentials ? <Text style={s.drSub}>{doctorCredentials}</Text> : null}
          {doctorSpecialty ? <Text style={s.drSub}>{doctorSpecialty}</Text> : null}
        </View>

        <View style={s.heavyRule} />

        <View style={s.patientRow}>
          {([
            ['Patient', visit.patient_name],
            ['Age', `${visit.patient_age}`],
            ['Gender', visit.patient_gender],
            ['Phone', visit.patient_contact || '\u2014'],
            ['MR No.', formatMrn(visit.patient_mrn)],
            ['Date', today()],
          ] as [string, string][]).map(([l, v]) => (
            <View key={l} style={s.patientItem}>
              <Text style={s.pLabel}>{l}</Text>
              <Text style={s.pValue}>{v}</Text>
            </View>
          ))}
        </View>

        {hasAllergies ? (
          <View style={s.allergyBox}>
            <Text style={s.allergyLabel}>Allergies</Text>
            <Text style={s.allergyText}>{allergies.trim()}</Text>
          </View>
        ) : null}

        <View style={s.thinRule} />

        {diagnosis.trim() ? (
          <>
            <Text style={s.sectionLabelFirst}>Diagnosis</Text>
            <Text style={s.sectionText}>{diagnosis.trim()}</Text>
          </>
        ) : null}

        {problemList.trim() ? (
          <>
            <Text style={s.sectionLabel}>Problem List</Text>
            <Text style={s.sectionText}>{problemList.trim()}</Text>
          </>
        ) : null}

        {meds.length > 0 ? (
          <>
            <Text style={s.sectionLabel}>Medications</Text>
            {meds.map((row, i) => {
              const urdu = buildUrduLine(row)
              return (
                <View key={row.id} style={s.medRow}>
                  <Text style={s.medName}>{i + 1}. {medDisplayName(row)}</Text>
                  <Text style={s.medDetail}>
                    {[row.dosage && `${row.dosage}`, row.frequency, row.duration && `${row.duration} days`].filter(Boolean).join(' \u2014 ')}
                  </Text>
                  {urdu ? <Text style={[s.urduLine, { fontFamily: urduFontFamily }]}>{urdu}</Text> : null}
                </View>
              )
            })}
          </>
        ) : null}

        {notes.trim() ? (
          <>
            <Text style={s.sectionLabel}>Advice</Text>
            <Text style={s.sectionText}>{notes.trim()}</Text>
          </>
        ) : null}

        {suggestedTests && suggestedTests.length > 0 ? (
          <>
            <Text style={s.sectionLabel}>Suggested Tests</Text>
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
