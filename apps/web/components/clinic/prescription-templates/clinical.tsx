/**
 * Clinical — Hospital-grade structured layout. Green medical accent, bordered patient grid,
 * full medication table with alternating rows, section header bars.
 * For hospital-affiliated practices and high-volume prescribers.
 */
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { formatMrn } from '@/lib/utils'
import type { PrescriptionTemplateProps, TemplateMetadata } from './index'
import {
  formatDate, today, fmtDr, filledMeds, buildUrduLine,
  medDisplayName, FOLLOW_UP_URDU, DISCLAIMER,
} from './_shared'

export const metadata: TemplateMetadata = {
  id: 'clinical',
  name: 'Clinical',
  description: 'Hospital-grade with tabular medication grid and structured data sections.',
  thumbnail: '/templates/clinical.svg',
}

const GREEN = '#1B5E20'
const GREEN_LIGHT = '#E8F5E9'
const GREEN_MID = '#A5D6A7'
const TEXT = '#212121'
const MUTED = '#616161'
const BORDER = '#9E9E9E'
const HEADER_BG = '#F5F5F5'
const ALT_ROW = '#FAFAFA'
const ALLERGY_RED = '#C62828'
const ALLERGY_BG = '#FFEBEE'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: TEXT, backgroundColor: '#FFFFFF', paddingHorizontal: 30, paddingTop: 24, paddingBottom: 20 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  drName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: GREEN, marginBottom: 2, letterSpacing: 0.2 },
  drSub: { fontSize: 8, color: MUTED, lineHeight: 1.4 },
  dateBadge: { backgroundColor: GREEN_LIGHT, borderWidth: 0.5, borderColor: GREEN_MID, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 4 },
  dateLabel: { fontSize: 6, color: GREEN, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 1 },
  dateText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: GREEN },

  headerDivider: { borderBottomWidth: 2, borderBottomColor: GREEN, marginBottom: 12 },

  patientGrid: { borderWidth: 0.75, borderColor: BORDER, borderRadius: 2, marginBottom: 12, overflow: 'hidden' },
  gridRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
  gridRowLast: { flexDirection: 'row' },
  cell: { flex: 1, paddingHorizontal: 8, paddingVertical: 5, borderRightWidth: 0.5, borderRightColor: BORDER },
  cellLast: { flex: 1, paddingHorizontal: 8, paddingVertical: 5 },
  cellLabel: { fontSize: 6.5, color: MUTED, textTransform: 'uppercase' as const, letterSpacing: 0.6, marginBottom: 2 },
  cellValue: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: TEXT },

  allergyBar: {
    flexDirection: 'row', gap: 6, alignItems: 'center',
    backgroundColor: ALLERGY_BG, borderWidth: 0.75, borderColor: '#EF9A9A',
    borderRadius: 2, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 12,
  },
  allergyIcon: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', backgroundColor: ALLERGY_RED, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 2 },
  allergyText: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: ALLERGY_RED, flex: 1 },

  sectionBox: { marginBottom: 10 },
  sectionHead: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', backgroundColor: GREEN, paddingHorizontal: 8, paddingVertical: 4, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  sectionBody: { paddingHorizontal: 8, paddingVertical: 6, borderWidth: 0.5, borderTopWidth: 0, borderColor: BORDER, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  sectionText: { fontSize: 9.5, color: TEXT, lineHeight: 1.55 },

  tableBox: { marginBottom: 10 },
  tableTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#FFFFFF', backgroundColor: GREEN, paddingHorizontal: 8, paddingVertical: 4, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  tableHeader: { flexDirection: 'row', backgroundColor: HEADER_BG, borderWidth: 0.5, borderTopWidth: 0, borderColor: BORDER },
  tRow: { flexDirection: 'row', borderWidth: 0.5, borderTopWidth: 0, borderColor: BORDER },
  tRowAlt: { flexDirection: 'row', borderWidth: 0.5, borderTopWidth: 0, borderColor: BORDER, backgroundColor: ALT_ROW },
  th: { paddingHorizontal: 6, paddingVertical: 3.5, fontSize: 7, fontFamily: 'Helvetica-Bold', color: MUTED, textTransform: 'uppercase' as const, letterSpacing: 0.4, borderRightWidth: 0.5, borderRightColor: BORDER },
  td: { paddingHorizontal: 6, paddingVertical: 4.5, fontSize: 9, color: TEXT, borderRightWidth: 0.5, borderRightColor: BORDER },
  tdLast: { paddingHorizontal: 6, paddingVertical: 4.5, fontSize: 9, color: TEXT },
  colNum: { width: 22 },
  colName: { flex: 1 },
  colDose: { width: 50 },
  colFreq: { width: 82 },
  colDur: { width: 40 },
  urduRow: { paddingHorizontal: 28, paddingVertical: 3, borderWidth: 0.5, borderTopWidth: 0, borderColor: BORDER, backgroundColor: GREEN_LIGHT },
  urduLine: { fontFamily: 'NotoNaskhArabic', fontSize: 8.5, color: '#333333' },

  testsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  testChip: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GREEN, backgroundColor: GREEN_LIGHT, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, borderWidth: 0.5, borderColor: GREEN_MID },

  followUp: { marginTop: 12, flexDirection: 'row', gap: 6, alignItems: 'center' },
  followUpLabel: { fontSize: 8, color: MUTED },
  followUpDate: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: GREEN },

  sigArea: { marginTop: 'auto', paddingBottom: 6, alignItems: 'flex-end' },
  sigLine: { width: 155, borderBottomWidth: 0.5, borderBottomColor: BORDER, marginBottom: 4 },
  sigText: { fontSize: 7.5, color: MUTED },

  footer: { borderTopWidth: 1.5, borderTopColor: GREEN, paddingTop: 8, flexDirection: 'column', gap: 2 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: MUTED },
  disclaimer: { fontSize: 6, color: MUTED, textAlign: 'center', marginTop: 2 },
})

export function ClinicalTemplate({
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
            {doctorCredentials ? <Text style={s.drSub}>{doctorCredentials}</Text> : null}
            {doctorSpecialty ? <Text style={s.drSub}>{doctorSpecialty}</Text> : null}
          </View>
          <View style={s.dateBadge}>
            <Text style={s.dateLabel}>Date</Text>
            <Text style={s.dateText}>{today()}</Text>
          </View>
        </View>

        <View style={s.headerDivider} />

        <View style={s.patientGrid}>
          <View style={s.gridRow}>
            <View style={s.cell}><Text style={s.cellLabel}>Patient Name</Text><Text style={s.cellValue}>{visit.patient_name}</Text></View>
            <View style={s.cell}><Text style={s.cellLabel}>Age / Gender</Text><Text style={s.cellValue}>{visit.patient_age} / {visit.patient_gender}</Text></View>
            <View style={s.cellLast}><Text style={s.cellLabel}>MR No.</Text><Text style={s.cellValue}>{formatMrn(visit.patient_mrn)}</Text></View>
          </View>
          <View style={s.gridRowLast}>
            <View style={s.cell}><Text style={s.cellLabel}>Phone</Text><Text style={s.cellValue}>{visit.patient_contact || '\u2014'}</Text></View>
            <View style={s.cellLast}><Text style={s.cellLabel}>Visit Date</Text><Text style={s.cellValue}>{today()}</Text></View>
          </View>
        </View>

        {hasAllergies ? (
          <View style={s.allergyBar}>
            <Text style={s.allergyIcon}>!</Text>
            <Text style={s.allergyText}>ALLERGIES: {allergies.trim()}</Text>
          </View>
        ) : null}

        {diagnosis.trim() ? (
          <View style={s.sectionBox}>
            <Text style={s.sectionHead}>Diagnosis</Text>
            <View style={s.sectionBody}><Text style={s.sectionText}>{diagnosis.trim()}</Text></View>
          </View>
        ) : null}

        {problemList.trim() ? (
          <View style={s.sectionBox}>
            <Text style={s.sectionHead}>Problem List</Text>
            <View style={s.sectionBody}><Text style={s.sectionText}>{problemList.trim()}</Text></View>
          </View>
        ) : null}

        {meds.length > 0 ? (
          <View style={s.tableBox}>
            <Text style={s.tableTitle}>Prescribed Medications (Rx)</Text>
            <View style={s.tableHeader}>
              <Text style={[s.th, s.colNum]}>#</Text>
              <Text style={[s.th, s.colName]}>Medicine</Text>
              <Text style={[s.th, s.colDose]}>Dose</Text>
              <Text style={[s.th, s.colFreq]}>Frequency</Text>
              <Text style={[s.th, s.colDur, { borderRightWidth: 0 }]}>Days</Text>
            </View>
            {meds.map((row, i) => {
              const urdu = buildUrduLine(row)
              const dur = row.duration?.trim()
              return (
                <View key={row.id}>
                  <View style={i % 2 === 1 ? s.tRowAlt : s.tRow}>
                    <Text style={[s.td, s.colNum, { fontFamily: 'Helvetica-Bold', color: GREEN }]}>{i + 1}</Text>
                    <Text style={[s.td, s.colName, { fontFamily: 'Helvetica-Bold' }]}>{medDisplayName(row)}</Text>
                    <Text style={[s.td, s.colDose]}>{row.dosage}</Text>
                    <Text style={[s.td, s.colFreq]}>{row.frequency}</Text>
                    <Text style={[s.tdLast, s.colDur]}>{dur || ''}</Text>
                  </View>
                  {urdu ? (
                    <View style={s.urduRow}>
                      <Text style={[s.urduLine, { fontFamily: urduFontFamily }]}>{urdu}</Text>
                    </View>
                  ) : null}
                </View>
              )
            })}
          </View>
        ) : null}

        {notes.trim() ? (
          <View style={s.sectionBox}>
            <Text style={s.sectionHead}>Advice / Notes</Text>
            <View style={s.sectionBody}><Text style={s.sectionText}>{notes.trim()}</Text></View>
          </View>
        ) : null}

        {suggestedTests && suggestedTests.length > 0 ? (
          <View style={s.sectionBox}>
            <Text style={s.sectionHead}>Suggested Tests</Text>
            <View style={[s.sectionBody, { flexDirection: 'row', flexWrap: 'wrap', gap: 4 }]}>
              {suggestedTests.map((t, i) => <Text key={i} style={s.testChip}>{t}</Text>)}
            </View>
          </View>
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
