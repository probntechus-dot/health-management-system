/**
 * Compact — Maximum information density. Deep purple accent, tag-style section labels,
 * tight two-column split, condensed medication list.
 * For the high-volume GP prescribing 8–12 medicines per visit.
 */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatMrn } from '@/lib/utils'
import type { PrescriptionTemplateProps, TemplateMetadata } from './index'
import {
  formatDate, today, fmtDr, filledMeds, buildUrduLine,
  medDisplayName, FOLLOW_UP_URDU, DISCLAIMER,
} from './_shared'

export const metadata: TemplateMetadata = {
  id: 'compact',
  name: 'Compact',
  description: 'Dense two-column layout with tag labels \u2014 fits 8\u201312 medicines per page.',
  thumbnail: '/templates/compact.svg',
}

const PURPLE = '#4A148C'
const PURPLE_LIGHT = '#F3E5F5'
const PURPLE_MID = '#CE93D8'
const TEXT = '#1A1A1A'
const MUTED = '#666666'
const RULE = '#BDBDBD'
const ALLERGY_RED = '#C62828'
const ALLERGY_BG = '#FFEBEE'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 8.5, color: TEXT, backgroundColor: '#FFFFFF', paddingHorizontal: 28, paddingTop: 18, paddingBottom: 16 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 6, borderBottomWidth: 1.5, borderBottomColor: PURPLE, marginBottom: 6 },
  drName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: PURPLE, marginBottom: 1, letterSpacing: 0.2 },
  drSub: { fontSize: 7.5, color: MUTED },
  dateBadge: { backgroundColor: PURPLE_LIGHT, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 2 },
  dateText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: PURPLE },

  patientBar: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 14,
    backgroundColor: PURPLE_LIGHT, borderRadius: 2,
    paddingHorizontal: 8, paddingVertical: 5, marginBottom: 6,
  },
  patientItem: { flexDirection: 'row', gap: 3 },
  patientLabel: { fontSize: 7.5, color: MUTED },
  patientValue: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: TEXT },

  allergyLine: {
    flexDirection: 'row', gap: 4, alignItems: 'center',
    backgroundColor: ALLERGY_BG, borderRadius: 2,
    paddingHorizontal: 8, paddingVertical: 4, marginBottom: 6,
    borderWidth: 0.5, borderColor: '#EF9A9A',
  },
  allergyTag: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', backgroundColor: ALLERGY_RED, paddingHorizontal: 4, paddingVertical: 1.5, borderRadius: 2 },
  allergyText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: ALLERGY_RED, flex: 1 },

  body: { flexDirection: 'row', flex: 1 },
  colLeft: { width: '30%', paddingRight: 10 },
  colRight: { width: '70%', paddingLeft: 10, borderLeftWidth: 0.5, borderLeftColor: RULE },

  tag: {
    fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#FFFFFF',
    backgroundColor: PURPLE, paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 2, alignSelf: 'flex-start', marginBottom: 4, marginTop: 6,
  },
  tagFirst: {
    fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#FFFFFF',
    backgroundColor: PURPLE, paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 2, alignSelf: 'flex-start', marginBottom: 4,
  },
  sectionText: { fontSize: 8.5, color: TEXT, lineHeight: 1.5, marginBottom: 4 },

  rxLabel: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: PURPLE, marginBottom: 6 },

  medRow: { flexDirection: 'row', marginBottom: 5, gap: 4 },
  medNum: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: PURPLE, width: 14 },
  medBody: { flex: 1 },
  medName: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: TEXT, marginBottom: 1 },
  medDetail: { fontSize: 7, color: MUTED },
  urduLine: { fontFamily: 'NotoNaskhArabic', fontSize: 7.5, color: '#444444', marginTop: 1 },

  testsContainer: { marginTop: 6 },
  testsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  testChip: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: PURPLE, backgroundColor: PURPLE_LIGHT, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2 },

  followUp: { marginTop: 8, flexDirection: 'row', gap: 4, alignItems: 'center' },
  followUpLabel: { fontSize: 7, color: MUTED },
  followUpDate: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: PURPLE },

  sigArea: { marginTop: 'auto', paddingBottom: 4, alignItems: 'flex-end' },
  sigLine: { width: 120, borderBottomWidth: 0.5, borderBottomColor: RULE, marginBottom: 3 },
  sigText: { fontSize: 7, color: MUTED },

  footer: { borderTopWidth: 1, borderTopColor: PURPLE, paddingTop: 4, flexDirection: 'column', gap: 2 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 6.5, color: MUTED },
  disclaimer: { fontSize: 5.5, color: MUTED, textAlign: 'center' },
})

export function CompactTemplate({
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
        <View style={s.headerRow}>
          <View>
            <Text style={s.drName}>{fmtDr(doctorName)}</Text>
            <Text style={s.drSub}>{[doctorCredentials, doctorSpecialty].filter(Boolean).join(' \u2014 ')}</Text>
          </View>
          <View style={s.dateBadge}>
            <Text style={s.dateText}>{today()}</Text>
          </View>
        </View>

        <View style={s.patientBar}>
          {([
            ['Name', visit.patient_name],
            ['Age', `${visit.patient_age} / ${visit.patient_gender}`],
            ['Phone', visit.patient_contact || '\u2014'],
            ['MR#', formatMrn(visit.patient_mrn)],
          ] as [string, string][]).map(([l, v]) => (
            <View key={l} style={s.patientItem}>
              <Text style={s.patientLabel}>{l}:</Text>
              <Text style={s.patientValue}>{v}</Text>
            </View>
          ))}
        </View>

        {hasAllergies ? (
          <View style={s.allergyLine}>
            <Text style={s.allergyTag}>!</Text>
            <Text style={s.allergyText}>{allergies.trim()}</Text>
          </View>
        ) : null}

        <View style={s.body}>
          <View style={s.colLeft}>
            {diagnosis.trim() ? (
              <>
                <Text style={s.tagFirst}>DIAGNOSIS</Text>
                <Text style={s.sectionText}>{diagnosis.trim()}</Text>
              </>
            ) : null}
            {problemList.trim() ? (
              <>
                <Text style={s.tag}>PROBLEMS</Text>
                <Text style={s.sectionText}>{problemList.trim()}</Text>
              </>
            ) : null}
            {notes.trim() ? (
              <>
                <Text style={s.tag}>ADVICE</Text>
                <Text style={s.sectionText}>{notes.trim()}</Text>
              </>
            ) : null}
            {suggestedTests && suggestedTests.length > 0 ? (
              <View style={s.testsContainer}>
                <Text style={s.tag}>TESTS</Text>
                <View style={s.testsRow}>
                  {suggestedTests.map((t, i) => <Text key={i} style={s.testChip}>{t}</Text>)}
                </View>
              </View>
            ) : null}
          </View>

          <View style={s.colRight}>
            {meds.length > 0 ? (
              <>
                <Text style={s.rxLabel}>Rx \u2014 Medications</Text>
                {meds.map((row, i) => {
                  const urdu = buildUrduLine(row)
                  return (
                    <View key={row.id} style={s.medRow}>
                      <Text style={s.medNum}>{i + 1}.</Text>
                      <View style={s.medBody}>
                        <Text style={s.medName}>{medDisplayName(row)}</Text>
                        <Text style={s.medDetail}>
                          {[row.dosage, row.frequency, row.duration && `${row.duration}d`].filter(Boolean).join(' / ')}
                        </Text>
                        {urdu ? <Text style={[s.urduLine, { fontFamily: urduFontFamily }]}>{urdu}</Text> : null}
                      </View>
                    </View>
                  )
                })}
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
