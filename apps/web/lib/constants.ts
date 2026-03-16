/**
 * Application-wide constants.
 *
 * Keep this file lean — only values that are referenced in 2+ places
 * or that benefit from a named constant (magic strings, magic numbers).
 */

// ── Visit status ─────────────────────────────────────────────────────────────

/** All valid visit statuses. Order reflects the typical clinic workflow. */
export const VISIT_STATUS = {
  WAITING:   'waiting',
  CALLED:    'called',
  CHECKED:   'checked',
  CANCELLED: 'cancelled',
} as const

// ── Prescription frequencies ──────────────────────────────────────────────────

/** Ordered list of frequency options shown in the prescription modal. */
export const FREQUENCIES = [
  'Once Daily',
  'Twice Daily',
  'Three Times Daily',
  'Four Times Daily',
  'Every 4 Hours',
  'Every 6 Hours',
  'Every 8 Hours',
  'Every 12 Hours',
  'Every Other Day',
  'Once Weekly',
  'Every Morning',
  'Once at Night',
  'As Needed',
  'Immediately (STAT)',
  'At Bedtime',
  'Before Meals',
  'After Meals',
] as const

/** Default instruction text auto-filled when a frequency is selected. */
export const FREQ_INSTRUCTIONS: Record<string, string> = {
  'Once Daily':         'روزانہ ایک بار کھانے کے بعد',
  'Twice Daily':        'روزانہ دو بار کھانے کے بعد',
  'Three Times Daily':  'روزانہ تین بار کھانے کے بعد',
  'Four Times Daily':   'روزانہ چار بار کھانے کے بعد',
  'Every 4 Hours':      'ہر 4 گھنٹے بعد',
  'Every 6 Hours':      'ہر 6 گھنٹے بعد',
  'Every 8 Hours':      'ہر 8 گھنٹے بعد',
  'Every 12 Hours':     'ہر 12 گھنٹے بعد',
  'Every Other Day':    'ایک دن چھوڑ کر',
  'Once Weekly':        'ہفتے میں ایک بار اسی دن',
  'Every Morning':      'ہر صبح',
  'Once at Night':      'ہر رات ایک بار',
  'As Needed':          'ضرورت کے مطابق',
  'Immediately (STAT)': 'فوراً ڈاکٹر کی ہدایت کے مطابق',
  'At Bedtime':         'سونے سے پہلے',
  'Before Meals':       'کھانے سے پہلے',
  'After Meals':        'کھانے کے بعد',
}

// ── Dosage forms ──────────────────────────────────────────────────────────────

/**
 * Canonical dosage form identifiers.
 * These match the `dosage_form` column values in the medicines table.
 */
export type DosageForm =
  | 'tablet'
  | 'capsule'
  | 'syrup'
  | 'drops'
  | 'injection'
  | 'cream'
  | 'inhaler'
  | 'suppository'
  | 'patch'
  | 'sachet'
  | 'lozenge'
  | 'gel'
  | 'other'

/** Display labels for each dosage form (shown in UI and PDF). */
export const DOSAGE_FORM_LABELS: Record<DosageForm, string> = {
  tablet:      'Tablet',
  capsule:     'Capsule',
  syrup:       'Syrup',
  drops:       'Drops',
  injection:   'Injection',
  cream:       'Cream/Ointment',
  inhaler:     'Inhaler',
  suppository: 'Suppository',
  patch:       'Patch',
  sachet:      'Sachet',
  lozenge:     'Lozenge',
  gel:         'Gel',
  other:       'Other',
}

/**
 * Dosage → Urdu instruction text, keyed by dosage form.
 *
 * Whole numbers 1–10, fractions (1/4, 1/2, 3/4), and form-specific
 * volume/drop measures are included per clinical convention:
 *   - tablets/capsules/lozenges/suppositories  → count units
 *   - syrups/sachets                           → spoon/ml measures
 *   - drops                                    → قطرہ / قطرے
 *   - injections                               → ml units
 *   - topical (cream, gel, patch)              → application terms
 *   - inhaler                                  → پف / پف
 */
export const DOSAGE_URDU_BY_FORM: Record<DosageForm, Record<string, string>> = {

  tablet: {
    '1/4': 'ایک چوتھائی گولی',
    '1/2': 'آدھی گولی',
    '3/4': 'تین چوتھائی گولی',
    '1':   'ایک گولی',
    '2':   'دو گولیاں',
    '3':   'تین گولیاں',
    '4':   'چار گولیاں',
    '5':   'پانچ گولیاں',
    '6':   'چھ گولیاں',
    '7':   'سات گولیاں',
    '8':   'آٹھ گولیاں',
    '9':   'نو گولیاں',
    '10':  'دس گولیاں',
  },

  capsule: {
    '1/2': 'آدھا کیپسول',
    '1':   'ایک کیپسول',
    '2':   'دو کیپسول',
    '3':   'تین کیپسول',
    '4':   'چار کیپسول',
    '5':   'پانچ کیپسول',
    '6':   'چھ کیپسول',
    '7':   'سات کیپسول',
    '8':   'آٹھ کیپسول',
    '9':   'نو کیپسول',
    '10':  'دس کیپسول',
  },

  syrup: {
    '2.5ml':  'آدھا چائے کا چمچ (2.5 ملی)',
    '5ml':    'ایک چائے کا چمچ (5 ملی)',
    '7.5ml':  'ڈیڑھ چائے کا چمچ (7.5 ملی)',
    '10ml':   'دو چائے کے چمچ (10 ملی)',
    '15ml':   'ایک کھانے کا چمچ (15 ملی)',
    '20ml':   'چار چائے کے چمچ (20 ملی)',
    '1/4':    'ایک چوتھائی چمچ',
    '1/2':    'آدھا چمچ',
    '1':      'ایک چمچ',
    '2':      'دو چمچ',
    '3':      'تین چمچ',
  },

  drops: {
    '1':  'ایک قطرہ',
    '2':  'دو قطرے',
    '3':  'تین قطرے',
    '4':  'چار قطرے',
    '5':  'پانچ قطرے',
    '6':  'چھ قطرے',
    '7':  'سات قطرے',
    '8':  'آٹھ قطرے',
    '9':  'نو قطرے',
    '10': 'دس قطرے',
  },

  injection: {
    '0.5ml': 'آدھا ملی لیٹر',
    '1ml':   'ایک ملی لیٹر',
    '2ml':   'دو ملی لیٹر',
    '3ml':   'تین ملی لیٹر',
    '4ml':   'چار ملی لیٹر',
    '5ml':   'پانچ ملی لیٹر',
    '10ml':  'دس ملی لیٹر',
    '1':     'ایک انجکشن',
    '2':     'دو انجکشن',
  },

  cream: {
    '1': 'تھوڑی مقدار میں لگائیں',
    '2': 'دو بار لگائیں',
    '3': 'تین بار لگائیں',
  },

  inhaler: {
    '1':  'ایک پف',
    '2':  'دو پف',
    '3':  'تین پف',
    '4':  'چار پف',
    '1/2': 'آدھا پف',
  },

  suppository: {
    '1': 'ایک سپوزیٹری',
    '2': 'دو سپوزیٹری',
  },

  patch: {
    '1': 'ایک پیچ لگائیں',
  },

  sachet: {
    '1':  'ایک ساشے',
    '2':  'دو ساشے',
    '3':  'تین ساشے',
    '1/2': 'آدھا ساشے',
  },

  lozenge: {
    '1': 'ایک لوزنج',
    '2': 'دو لوزنج',
    '3': 'تین لوزنج',
    '4': 'چار لوزنج',
    '5': 'پانچ لوزنج',
  },

  gel: {
    '1': 'تھوڑی مقدار میں لگائیں',
    '2': 'دو بار لگائیں',
    '3': 'تین بار لگائیں',
  },

  /** Free-text form — no pre-defined Urdu hints. */
  other: {},
}

/**
 * Look up the Urdu dosage hint for a given form + quantity.
 * Returns empty string for 'other' (free-text) or any unrecognised form,
 * since the doctor will type their own dosage in those cases.
 */
export function getDosageUrdu(form: DosageForm | string, quantity: string): string {
  if (!quantity.trim() || form === 'other') return ''
  const map = DOSAGE_URDU_BY_FORM[form as DosageForm]
  if (map) return map[quantity.trim()] ?? ''
  return ''
}

/**
 * Parse a raw `dosage_form` string from the medicines DB into a canonical
 * DosageForm key. Returns 'other' when the value is absent or unrecognised,
 * so the doctor is prompted to explicitly choose the form rather than being
 * silently defaulted to 'tablet'.
 */
export function parseDosageForm(raw: string | null | undefined): DosageForm {
  if (!raw) return 'other'
  const key = raw.trim().toLowerCase()
  const aliases: Record<string, DosageForm> = {
    tablet:        'tablet',
    tablets:       'tablet',
    tab:           'tablet',
    capsule:       'capsule',
    capsules:      'capsule',
    cap:           'capsule',
    syrup:         'syrup',
    suspension:    'syrup',
    solution:      'syrup',
    liquid:        'syrup',
    drops:         'drops',
    drop:          'drops',
    'eye drops':   'drops',
    'ear drops':   'drops',
    'nasal drops': 'drops',
    injection:     'injection',
    injectable:    'injection',
    inj:           'injection',
    cream:         'cream',
    ointment:      'cream',
    lotion:        'cream',
    inhaler:       'inhaler',
    puffer:        'inhaler',
    suppository:   'suppository',
    suppositories: 'suppository',
    supp:          'suppository',
    patch:         'patch',
    patches:       'patch',
    sachet:        'sachet',
    powder:        'sachet',
    sachets:       'sachet',
    lozenge:       'lozenge',
    lozenges:      'lozenge',
    pastille:      'lozenge',
    gel:           'gel',
    gels:          'gel',
    other:         'other',
  }
  return aliases[key] ?? 'other'
}

/** @deprecated Use `parseDosageForm` instead. */
export const normaliseDosageForm = parseDosageForm

/**
 * @deprecated Use DOSAGE_URDU_BY_FORM.tablet instead.
 * Kept for backward-compatibility with existing prescription records
 * that were written before dosage forms were tracked.
 */
export const DOSAGE_URDU: Record<string, string> = DOSAGE_URDU_BY_FORM.tablet

// ── Medical Tests (Suggestions) ───────────────────────────────────────────────

export type TestSuggestion = { category: string; label: string; aliases: string[] }

/** Most commonly ordered tests shown as quick-pick chips. */
export const COMMON_TESTS = [
  'CBC', 'ESR', 'CRP', 'LFT', 'RFT', 'HbA1c',
  'Fasting Blood Sugar', 'Lipid Profile', 'Urine R/E', 'TSH',
  'Serum Electrolytes', 'X-Ray Chest PA View', 'ECG', 'USG Abdomen (Whole)',
] as const

/** Full categorized test catalog for search/autocomplete. */
export const ALL_TESTS: TestSuggestion[] = [
  // ── Hematology ──
  { category: 'Hematology', label: 'CBC', aliases: ['Complete Blood Count', 'CBP', 'FBC', 'Blood CP', 'C/E', 'Hemogram'] },
  { category: 'Hematology', label: 'ESR', aliases: ['Erythrocyte Sedimentation Rate'] },
  { category: 'Hematology', label: 'Peripheral Blood Smear', aliases: ['PBS', 'Blood Film'] },
  { category: 'Hematology', label: 'Hemoglobin', aliases: ['Hb', 'Hgb'] },
  { category: 'Hematology', label: 'Platelet Count', aliases: ['PLT'] },
  { category: 'Hematology', label: 'PT / INR', aliases: ['Prothrombin Time', 'INR', 'PT'] },
  { category: 'Hematology', label: 'aPTT', aliases: ['APTT', 'PTT'] },
  { category: 'Hematology', label: 'D-Dimer', aliases: ['D Dimer'] },
  { category: 'Hematology', label: 'Blood Group & Rh', aliases: ['Blood Grouping', 'ABO Rh', 'Blood Type'] },
  { category: 'Hematology', label: 'G6PD Level', aliases: ['G6PD Quantitative'] },
  { category: 'Hematology', label: 'Iron Studies', aliases: ['Serum Iron', 'TIBC', 'Iron Profile'] },
  { category: 'Hematology', label: 'Serum Ferritin', aliases: ['Ferritin'] },
  { category: 'Hematology', label: 'Hemoglobin Electrophoresis', aliases: ['Hb Electrophoresis', 'HbE'] },
  // ── Biochemistry ──
  { category: 'Biochemistry', label: 'Fasting Blood Sugar', aliases: ['FBS', 'Fasting Glucose', 'FBG'] },
  { category: 'Biochemistry', label: 'Random Blood Sugar', aliases: ['RBS', 'Random Glucose', 'RBG'] },
  { category: 'Biochemistry', label: 'Post-Prandial Blood Sugar', aliases: ['PPBS', 'PP Sugar'] },
  { category: 'Biochemistry', label: 'OGTT', aliases: ['Oral Glucose Tolerance Test', 'GTT'] },
  { category: 'Biochemistry', label: 'HbA1c', aliases: ['Glycated Hemoglobin', 'A1c'] },
  { category: 'Biochemistry', label: 'Lipid Profile', aliases: ['Lipid Panel', 'Cholesterol Panel'] },
  { category: 'Biochemistry', label: 'Total Cholesterol', aliases: ['Cholesterol', 'TC'] },
  { category: 'Biochemistry', label: 'HDL Cholesterol', aliases: ['HDL', 'HDL-C'] },
  { category: 'Biochemistry', label: 'LDL Cholesterol', aliases: ['LDL', 'LDL-C'] },
  { category: 'Biochemistry', label: 'Triglycerides', aliases: ['TG'] },
  { category: 'Biochemistry', label: 'Serum Uric Acid', aliases: ['Uric Acid', 'SUA'] },
  { category: 'Biochemistry', label: 'Serum Calcium', aliases: ['Calcium', 'Ca'] },
  { category: 'Biochemistry', label: 'Serum Electrolytes', aliases: ['Electrolytes', 'Lytes', 'Na/K/Cl'] },
  { category: 'Biochemistry', label: 'ABG', aliases: ['Arterial Blood Gases', 'Blood Gases'] },
  { category: 'Biochemistry', label: 'Serum Ammonia', aliases: ['Ammonia', 'NH3'] },
  // ── Liver Function ──
  { category: 'Liver', label: 'LFT', aliases: ['Liver Function Tests', 'LFTs', 'Liver Panel'] },
  { category: 'Liver', label: 'Serum Bilirubin', aliases: ['Bilirubin', 'Total Bilirubin', 'Direct Bilirubin'] },
  { category: 'Liver', label: 'SGPT / ALT', aliases: ['ALT', 'SGPT'] },
  { category: 'Liver', label: 'SGOT / AST', aliases: ['AST', 'SGOT'] },
  { category: 'Liver', label: 'Alkaline Phosphatase', aliases: ['ALP'] },
  { category: 'Liver', label: 'GGT', aliases: ['Gamma GT', 'GGTP'] },
  { category: 'Liver', label: 'Serum Albumin', aliases: ['Albumin'] },
  { category: 'Liver', label: 'HBsAg', aliases: ['Hepatitis B', 'Hep B'] },
  { category: 'Liver', label: 'Anti-HCV', aliases: ['Hepatitis C', 'Hep C'] },
  // ── Kidney / Renal ──
  { category: 'Renal', label: 'RFT', aliases: ['Renal Function Tests', 'KFT', 'Kidney Function Tests'] },
  { category: 'Renal', label: 'Blood Urea', aliases: ['BUN', 'Blood Urea Nitrogen'] },
  { category: 'Renal', label: 'Serum Creatinine', aliases: ['Creatinine', 'Cr'] },
  { category: 'Renal', label: 'eGFR', aliases: ['Estimated GFR', 'Glomerular Filtration Rate'] },
  { category: 'Renal', label: 'Urine R/E', aliases: ['Urine Routine', 'Urinalysis', 'Urine R/M', 'Urine DR'] },
  { category: 'Renal', label: 'Urine C/S', aliases: ['Urine Culture & Sensitivity', 'Urine Culture'] },
  { category: 'Renal', label: 'Urine Microalbumin', aliases: ['Microalbuminuria', 'Urine ACR'] },
  // ── Thyroid & Hormones ──
  { category: 'Hormones', label: 'TSH', aliases: ['Thyroid Stimulating Hormone'] },
  { category: 'Hormones', label: 'Free T3', aliases: ['FT3'] },
  { category: 'Hormones', label: 'Free T4', aliases: ['FT4'] },
  { category: 'Hormones', label: 'Thyroid Profile', aliases: ['TFT', 'Thyroid Panel'] },
  { category: 'Hormones', label: 'Anti-TPO', aliases: ['Anti-Thyroid Peroxidase', 'TPO Ab'] },
  { category: 'Hormones', label: 'Serum Cortisol', aliases: ['Cortisol'] },
  { category: 'Hormones', label: 'Serum Prolactin', aliases: ['Prolactin', 'PRL'] },
  { category: 'Hormones', label: 'Testosterone', aliases: ['Total Testosterone'] },
  { category: 'Hormones', label: 'FSH', aliases: ['Follicle Stimulating Hormone'] },
  { category: 'Hormones', label: 'LH', aliases: ['Luteinizing Hormone'] },
  { category: 'Hormones', label: 'Beta-hCG', aliases: ['Serum hCG', 'Pregnancy Test (Blood)'] },
  { category: 'Hormones', label: 'Vitamin D', aliases: ['25-OH Vitamin D'] },
  { category: 'Hormones', label: 'Vitamin B12', aliases: ['Cobalamin'] },
  { category: 'Hormones', label: 'Serum Folate', aliases: ['Folic Acid', 'Folate'] },
  { category: 'Hormones', label: 'PTH', aliases: ['Parathyroid Hormone'] },
  // ── Immunology & Serology ──
  { category: 'Immunology', label: 'CRP', aliases: ['C-Reactive Protein'] },
  { category: 'Immunology', label: 'hs-CRP', aliases: ['High-Sensitivity CRP'] },
  { category: 'Immunology', label: 'Rheumatoid Factor', aliases: ['RF', 'RA Factor'] },
  { category: 'Immunology', label: 'ANA', aliases: ['Antinuclear Antibody'] },
  { category: 'Immunology', label: 'ASO Titer', aliases: ['Anti-Streptolysin O', 'ASOT'] },
  { category: 'Immunology', label: 'Widal Test', aliases: ['Typhoid Test'] },
  { category: 'Immunology', label: 'Typhidot', aliases: ['Typhoid IgM/IgG'] },
  { category: 'Immunology', label: 'Dengue NS1', aliases: ['NS1', 'Dengue NS1 Antigen'] },
  { category: 'Immunology', label: 'Dengue IgM/IgG', aliases: ['Dengue Serology'] },
  { category: 'Immunology', label: 'Malarial Parasite', aliases: ['MP', 'Malaria Smear', 'Blood for MP'] },
  { category: 'Immunology', label: 'HIV Screening', aliases: ['HIV', 'Anti-HIV'] },
  { category: 'Immunology', label: 'VDRL', aliases: ['Syphilis Screening', 'RPR'] },
  { category: 'Immunology', label: 'Procalcitonin', aliases: ['PCT'] },
  // ── Tumor Markers ──
  { category: 'Tumor Markers', label: 'PSA', aliases: ['Prostate Specific Antigen'] },
  { category: 'Tumor Markers', label: 'CA-125', aliases: ['Cancer Antigen 125'] },
  { category: 'Tumor Markers', label: 'CEA', aliases: ['Carcinoembryonic Antigen'] },
  { category: 'Tumor Markers', label: 'AFP', aliases: ['Alpha Fetoprotein'] },
  // ── Microbiology ──
  { category: 'Microbiology', label: 'Blood Culture', aliases: ['Blood C/S'] },
  { category: 'Microbiology', label: 'Sputum Culture', aliases: ['Sputum C/S'] },
  { category: 'Microbiology', label: 'Wound Swab Culture', aliases: ['Wound C/S', 'Pus C/S'] },
  { category: 'Microbiology', label: 'Stool R/E', aliases: ['Stool Routine', 'Stool Examination'] },
  { category: 'Microbiology', label: 'Stool Occult Blood', aliases: ['FOB', 'FOBT'] },
  { category: 'Microbiology', label: 'AFB Smear', aliases: ['Acid Fast Bacilli', 'TB Smear'] },
  { category: 'Microbiology', label: 'GeneXpert MTB/RIF', aliases: ['GeneXpert', 'TB PCR'] },
  { category: 'Microbiology', label: 'Mantoux Test', aliases: ['TST', 'PPD'] },
  { category: 'Microbiology', label: 'H. Pylori Antigen', aliases: ['H. Pylori Stool Ag'] },
  // ── Special Tests ──
  { category: 'Special', label: 'Troponin I', aliases: ['Trop I', 'cTnI'] },
  { category: 'Special', label: 'NT-proBNP', aliases: ['BNP', 'Pro-BNP'] },
  { category: 'Special', label: 'CPK', aliases: ['Creatine Kinase', 'CK'] },
  { category: 'Special', label: 'LDH', aliases: ['Lactate Dehydrogenase'] },
  { category: 'Special', label: 'Serum Amylase', aliases: ['Amylase'] },
  { category: 'Special', label: 'Serum Lipase', aliases: ['Lipase'] },
  { category: 'Special', label: 'UPT', aliases: ['Urine Pregnancy Test', 'Urine hCG'] },
  // ── X-Ray ──
  { category: 'X-Ray', label: 'X-Ray Chest PA View', aliases: ['CXR', 'Chest X-Ray', 'Chest PA'] },
  { category: 'X-Ray', label: 'X-Ray Chest AP View', aliases: ['Chest AP'] },
  { category: 'X-Ray', label: 'X-Ray Abdomen (Erect)', aliases: ['Abdomen Erect', 'AXR'] },
  { category: 'X-Ray', label: 'X-Ray KUB', aliases: ['KUB'] },
  { category: 'X-Ray', label: 'X-Ray Pelvis AP', aliases: ['Pelvis X-Ray'] },
  { category: 'X-Ray', label: 'X-Ray Lumbar Spine', aliases: ['LS Spine X-Ray', 'X-Ray LS Spine'] },
  { category: 'X-Ray', label: 'X-Ray Cervical Spine', aliases: ['C-Spine X-Ray', 'X-Ray C-Spine'] },
  { category: 'X-Ray', label: 'X-Ray Thoracic Spine', aliases: ['Dorsal Spine X-Ray'] },
  { category: 'X-Ray', label: 'X-Ray Skull', aliases: ['Skull X-Ray'] },
  { category: 'X-Ray', label: 'X-Ray PNS', aliases: ['PNS X-Ray', 'Sinus X-Ray'] },
  { category: 'X-Ray', label: 'X-Ray Knee', aliases: ['Knee X-Ray'] },
  { category: 'X-Ray', label: 'X-Ray Shoulder', aliases: ['Shoulder X-Ray'] },
  { category: 'X-Ray', label: 'X-Ray Hand', aliases: ['Hand X-Ray'] },
  { category: 'X-Ray', label: 'X-Ray Ankle', aliases: ['Ankle X-Ray'] },
  { category: 'X-Ray', label: 'X-Ray Wrist', aliases: ['Wrist X-Ray'] },
  { category: 'X-Ray', label: 'X-Ray Foot', aliases: ['Foot X-Ray'] },
  { category: 'X-Ray', label: 'X-Ray Hip Joint', aliases: ['Hip X-Ray'] },
  { category: 'X-Ray', label: 'X-Ray Elbow', aliases: ['Elbow X-Ray'] },
  { category: 'X-Ray', label: 'X-Ray SI Joints', aliases: ['SI Joint X-Ray'] },
  // ── Ultrasound ──
  { category: 'Ultrasound', label: 'USG Abdomen (Whole)', aliases: ['Ultrasound Abdomen', 'USG Whole Abdomen'] },
  { category: 'Ultrasound', label: 'USG Abdomen & Pelvis', aliases: ['USG A/P'] },
  { category: 'Ultrasound', label: 'USG Pelvis', aliases: ['Pelvic Ultrasound'] },
  { category: 'Ultrasound', label: 'USG KUB', aliases: ['Renal Ultrasound', 'USG Kidneys'] },
  { category: 'Ultrasound', label: 'USG Thyroid', aliases: ['Thyroid Ultrasound'] },
  { category: 'Ultrasound', label: 'USG Breast', aliases: ['Breast Ultrasound'] },
  { category: 'Ultrasound', label: 'USG Obstetric', aliases: ['Pregnancy Ultrasound', 'Dating Scan', 'Anomaly Scan'] },
  { category: 'Ultrasound', label: 'USG Transvaginal', aliases: ['TVS'] },
  { category: 'Ultrasound', label: 'USG Scrotum', aliases: ['Scrotal Ultrasound'] },
  { category: 'Ultrasound', label: 'USG Doppler — Renal', aliases: ['Renal Doppler'] },
  { category: 'Ultrasound', label: 'USG Doppler — Lower Limb Venous', aliases: ['DVT Doppler'] },
  { category: 'Ultrasound', label: 'USG Doppler — Carotid', aliases: ['Carotid Doppler'] },
  // ── Cardiac ──
  { category: 'Cardiac', label: 'ECG', aliases: ['Electrocardiogram', 'EKG', '12-Lead ECG'] },
  { category: 'Cardiac', label: 'Echocardiography', aliases: ['Echo', '2D Echo', 'TTE'] },
  { category: 'Cardiac', label: 'Treadmill Test', aliases: ['TMT', 'Exercise Stress Test', 'ETT'] },
  { category: 'Cardiac', label: 'Holter Monitor', aliases: ['24hr ECG', 'Ambulatory ECG'] },
  { category: 'Cardiac', label: 'ABPM', aliases: ['24hr BP Monitor'] },
  // ── CT Scan ──
  { category: 'CT', label: 'CT Brain (Plain)', aliases: ['CT Head', 'NCCT Brain'] },
  { category: 'CT', label: 'CT Brain (Contrast)', aliases: ['CECT Brain'] },
  { category: 'CT', label: 'HRCT Chest', aliases: ['High Resolution CT Chest'] },
  { category: 'CT', label: 'CT Abdomen & Pelvis', aliases: ['CECT Abdomen', 'CT Abdomen'] },
  { category: 'CT', label: 'CT KUB', aliases: ['NCCT KUB', 'CT Stone Protocol'] },
  { category: 'CT', label: 'CT PNS', aliases: ['CT Sinuses'] },
  { category: 'CT', label: 'CTPA', aliases: ['CT Pulmonary Angiography'] },
  { category: 'CT', label: 'CT Coronary Angiography', aliases: ['CTCA'] },
  // ── MRI ──
  { category: 'MRI', label: 'MRI Brain', aliases: ['MRI Head'] },
  { category: 'MRI', label: 'MRI Cervical Spine', aliases: ['MRI C-Spine'] },
  { category: 'MRI', label: 'MRI Lumbar Spine', aliases: ['MRI LS Spine'] },
  { category: 'MRI', label: 'MRI Knee', aliases: ['MRI Knee Joint'] },
  { category: 'MRI', label: 'MRI Shoulder', aliases: ['MRI Shoulder Joint'] },
  { category: 'MRI', label: 'MRI Abdomen', aliases: [] },
  { category: 'MRI', label: 'MRCP', aliases: ['MR Cholangiopancreatography'] },
  { category: 'MRI', label: 'MRA Brain', aliases: ['MR Angiography Brain'] },
  // ── Other Diagnostics ──
  { category: 'Other', label: 'Pulmonary Function Test', aliases: ['PFT', 'Spirometry'] },
  { category: 'Other', label: 'EEG', aliases: ['Electroencephalogram'] },
  { category: 'Other', label: 'EMG', aliases: ['Electromyography'] },
  { category: 'Other', label: 'Nerve Conduction Study', aliases: ['NCS', 'NCV'] },
  { category: 'Other', label: 'Audiometry', aliases: ['Hearing Test', 'PTA'] },
  { category: 'Other', label: 'Bone Mineral Density', aliases: ['BMD', 'DEXA Scan'] },
  { category: 'Other', label: 'Mammography', aliases: ['Mammo'] },
  { category: 'Other', label: 'Pap Smear', aliases: ['Cervical Smear'] },
  { category: 'Other', label: 'Upper GI Endoscopy', aliases: ['OGD', 'EGD', 'Gastroscopy'] },
  { category: 'Other', label: 'Colonoscopy', aliases: ['Lower GI Endoscopy'] },
  // ── Profiles / Panels ──
  { category: 'Profiles', label: 'Diabetic Profile', aliases: ['Diabetes Panel', 'Sugar Profile'] },
  { category: 'Profiles', label: 'Cardiac Risk Profile', aliases: ['Heart Profile'] },
  { category: 'Profiles', label: 'Antenatal Profile', aliases: ['ANC Profile'] },
  { category: 'Profiles', label: 'Pre-Operative Profile', aliases: ['Pre-Op Workup'] },
  { category: 'Profiles', label: 'Fever Panel', aliases: ['Fever Workup'] },
  { category: 'Profiles', label: 'Autoimmune Panel', aliases: ['ANA Profile'] },
  { category: 'Profiles', label: 'Coagulation Profile', aliases: ['Coag Panel'] },
  { category: 'Profiles', label: 'TORCH Panel', aliases: ['TORCH Screen'] },
]

/** Search tests by query — matches label and aliases, case-insensitive. */
export function searchTests(query: string): TestSuggestion[] {
  if (!query || query.trim().length < 1) return []
  const q = query.toLowerCase().trim()
  return ALL_TESTS.filter(t =>
    t.label.toLowerCase().includes(q) ||
    t.aliases.some(a => a.toLowerCase().includes(q))
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────

/** Number of visits fetched per page. */
export const PAGE_SIZE = 50

// ── UI ────────────────────────────────────────────────────────────────────────

/** Brand colours used across status badges and interactive elements. */
export const COLORS = {
  PRIMARY:       '#1a73b5',
  PRIMARY_HOVER: '#155d94',
  PRIMARY_LIGHT: '#e8f2fb',
  BORDER:        '#dfe6ed',
  BORDER_LIGHT:  '#edf1f5',
  BG_INPUT:      '#f8fafb',
  BG_PAGE:       '#f0f4f8',
  TEXT_DARK:     '#1a2332',
  TEXT_SECONDARY:'#5a6577',
  TEXT_MUTED:    '#8893a4',
  // Status badge colours
  WAITING_BG:    '#fef9ec',
  WAITING_TEXT:  '#b45309',
  CALLED_BG:     '#ecfeff',
  CALLED_TEXT:   '#0e7490',
  CHECKED_BG:    '#ecfdf3',
  CHECKED_TEXT:  '#16a34a',
  CANCELLED_BG:  '#fef2f2',
  CANCELLED_TEXT:'#dc2626',
} as const
