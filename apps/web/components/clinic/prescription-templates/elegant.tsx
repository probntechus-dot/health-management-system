/**
 * Elegant — Premium specialist prescription. Double-rule borders, serif headings,
 * teal accent used sparingly, refined left-border medicine items, italic signature.
 * For the senior consultant who wants their prescription to feel important.
 */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatMrn } from '@/lib/utils'
import type { PrescriptionTemplateProps, TemplateMetadata } from './index'
import {
  formatDate, today, fmtDr, filledMeds, buildUrduLine,
  medDisplayName, medDetailLine, FOLLOW_UP_URDU, DISCLAIMER,
} from './_shared'

export const metadata: TemplateMetadata = {
  id: 'elegant',
  name: 'Elegant',
  description: 'Premium feel with serif headings, double borders, and refined teal accents.',
  thumbnail: '/templates/elegant.svg',
}

const TEAL = '#1A5276'
const TEAL_LIGHT = '#EAF2F8'
const TEAL_MID = '#AED6F1'
const WARM = '#2C3E50'
const MUTED = '#7F8C8D'
const RULE = '#BDC3C7'
const ALLERGY_RED = '#C0392B'
const ALLERGY_BG = '#FDEDEC'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: WARM, backgroundColor: '#FFFFFF', paddingHorizontal: 44, paddingTop: 36, paddingBottom: 24 },

  doubleBorderTop: { marginBottom: 2 },
  borderThick: { borderBottomWidth: 2.5, borderBottomColor: TEAL },
  borderThin: { borderBottomWidth: 0.5, borderBottomColor: TEAL, marginTop: 2.5 },

  header: { paddingTop: 18, paddingBottom: 4 },
  drName: { fontSize: 23, fontFamily: 'Times-Bold', color: TEAL, marginBottom: 4, letterSpacing: 0.5 },
  drCredentials: { fontSize: 9, color: MUTED, lineHeight: 1.5 },
  drSpecialty: { fontSize: 8, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: 1.2, marginTop: 3 },

  divider: { borderBottomWidth: 0.5, borderBottomColor: RULE, marginVertical: 14 },

  patientRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 32, marginBottom: 4 },
  patientItem: {},
  pLabel: { fontSize: 7, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 2 },
  pValue: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: WARM },

  allergyBox: {
    borderLeftWidth: 3, borderLeftColor: ALLERGY_RED,
    backgroundColor: ALLERGY_BG, borderRadius: 2,
    paddingHorizontal: 10, paddingVertical: 6, marginTop: 10,
    flexDirection: 'row', gap: 6, alignItems: 'center',
  },
  allergyLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: ALLERGY_RED, textTransform: 'uppercase' as const, letterSpacing: 0.6 },
  allergyText: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: ALLERGY_RED, flex: 1 },

  body: { flexDirection: 'row', flex: 1, marginTop: 8 },
  leftCol: { width: '33%', paddingRight: 18, borderRightWidth: 0.5, borderRightColor: RULE },
  rightCol: { width: '67%', paddingLeft: 22 },

  sectionLabel: { fontSize: 9, fontFamily: 'Times-Bold', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: 0.7, marginBottom: 6, marginTop: 16 },
  sectionLabelFirst: { fontSize: 9, fontFamily: 'Times-Bold', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: 0.7, marginBottom: 6 },
  sectionText: { fontSize: 10, color: WARM, lineHeight: 1.7, marginBottom: 4 },

  rxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  rxSymbol: { fontSize: 24, fontFamily: 'Times-BoldItalic', color: TEAL },
  rxTitle: { fontSize: 9, fontFamily: 'Times-Bold', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: 0.7 },

  medItem: { marginBottom: 11, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: TEAL_MID },
  medName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: WARM, marginBottom: 2 },
  medDetail: { fontSize: 8.5, color: MUTED, letterSpacing: 0.2 },
  urduLine: { fontFamily: 'NotoNaskhArabic', fontSize: 9, color: '#555555', marginTop: 2 },

  adviceArea: { backgroundColor: TEAL_LIGHT, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 3, marginTop: 14 },
  adviceLabel: { fontSize: 8, fontFamily: 'Times-Bold', color: TEAL, textTransform: 'uppercase' as const, letterSpacing: 0.6, marginBottom: 4 },
  adviceText: { fontSize: 9.5, color: WARM, lineHeight: 1.65 },

  testsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  testChip: { fontSize: 8, color: TEAL, backgroundColor: TEAL_LIGHT, paddingHorizontal: 8, paddingVertical: 3.5, borderRadius: 3, borderWidth: 0.5, borderColor: TEAL_MID },

  followUp: { marginTop: 16, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: RULE, flexDirection: 'row', gap: 6, alignItems: 'center' },
  followUpLabel: { fontSize: 8.5, color: MUTED },
  followUpDate: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: TEAL },

  sigArea: { marginTop: 'auto', paddingBottom: 8, alignItems: 'flex-end' },
  sigLine: { width: 170, borderBottomWidth: 0.5, borderBottomColor: RULE, marginBottom: 4 },
  sigName: { fontSize: 8.5, color: MUTED, fontFamily: 'Times-Italic' },

  doubleBorderBottom: { marginTop: 8 },
  borderThinBottom: { borderBottomWidth: 0.5, borderBottomColor: TEAL },
  borderThickBottom: { borderBottomWidth: 2.5, borderBottomColor: TEAL, marginTop: 2.5 },

  footer: { paddingTop: 8, flexDirection: 'column', gap: 2 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: MUTED, letterSpacing: 0.2 },
  disclaimer: { fontSize: 5.5, color: MUTED, textAlign: 'center', marginTop: 2 },
})

export function ElegantTemplate({
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
        <View style={s.doubleBorderTop}>
          <View style={s.borderThick} />
          <View style={s.borderThin} />
        </View>

        <View style={s.header}>
          <Text style={s.drName}>{fmtDr(doctorName)}</Text>
          {doctorCredentials ? <Text style={s.drCredentials}>{doctorCredentials}</Text> : null}
          {doctorSpecialty ? <Text style={s.drSpecialty}>{doctorSpecialty}</Text> : null}
        </View>

        <View style={s.divider} />

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
            <Text style={s.allergyLabel}>Allergies:</Text>
            <Text style={s.allergyText}>{allergies.trim()}</Text>
          </View>
        ) : null}

        <View style={s.divider} />

        <View style={s.body}>
          <View style={s.leftCol}>
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
          </View>

          <View style={s.rightCol}>
            {meds.length > 0 ? (
              <>
                <View style={s.rxHeader}>
                  <Text style={s.rxSymbol}>Rx</Text>
                  <Text style={s.rxTitle}>Prescribed Medications</Text>
                </View>
                {meds.map((row, i) => {
                  const urdu = buildUrduLine(row)
                  return (
                    <View key={row.id} style={s.medItem}>
                      <Text style={s.medName}>{i + 1}. {medDisplayName(row)}</Text>
                      <Text style={s.medDetail}>{medDetailLine(row, '  |  ')}</Text>
                      {urdu ? <Text style={[s.urduLine, { fontFamily: urduFontFamily }]}>{urdu}</Text> : null}
                    </View>
                  )
                })}
              </>
            ) : null}

            {notes.trim() ? (
              <View style={s.adviceArea}>
                <Text style={s.adviceLabel}>Advice</Text>
                <Text style={s.adviceText}>{notes.trim()}</Text>
              </View>
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
          </View>
        </View>

        <View style={s.sigArea}>
          <View style={s.sigLine} />
          <Text style={s.sigName}>{fmtDr(doctorName)}</Text>
        </View>

        <View style={s.doubleBorderBottom}>
          <View style={s.borderThinBottom} />
          <View style={s.borderThickBottom} />
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
