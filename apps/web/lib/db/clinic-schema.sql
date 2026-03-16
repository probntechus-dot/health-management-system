-- =====================================================
-- Per-tenant schema template
-- Applied inside clinic_{slug} schema by provision.ts.
-- Do NOT run this manually — use the admin page or
-- provision.ts createClinicSchema().
-- =====================================================

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Patients — one row per unique person (identified by contact_number)
CREATE TABLE IF NOT EXISTS patients (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  mrn            INTEGER     GENERATED ALWAYS AS IDENTITY UNIQUE NOT NULL,
  full_name      TEXT        NOT NULL,
  age            INTEGER,
  gender         TEXT        CHECK (gender IN ('Male', 'Female', 'Other')),
  contact_number TEXT        NOT NULL UNIQUE,
  address        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Visits — one row per appointment/check-in
CREATE TABLE IF NOT EXISTS visits (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  token_number     INTEGER     NOT NULL,
  token_label      TEXT        GENERATED ALWAYS AS ('T-' || LPAD(token_number::TEXT, 2, '0')) STORED,
  reason_for_visit TEXT,
  status           TEXT        NOT NULL DEFAULT 'waiting'
                     CHECK (status IN ('waiting', 'called', 'checked', 'cancelled')),
  priority         TEXT        NOT NULL DEFAULT 'normal'
                     CHECK (priority IN ('low', 'normal', 'high', 'emergency')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prescriptions — one per visit
CREATE TABLE IF NOT EXISTS prescriptions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id        UUID        NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  medicines       JSONB       NOT NULL DEFAULT '[]',
  diagnosis       TEXT,
  problem_list    TEXT,
  allergies       TEXT,
  notes           TEXT,
  follow_up       DATE,
  suggested_tests JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Medicines master list (autocomplete suggestions)
CREATE TABLE IF NOT EXISTS medicines (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  generic_name TEXT,
  dosage_form  TEXT,
  strength     TEXT,
  category     TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patients_contact    ON patients(contact_number);
CREATE INDEX IF NOT EXISTS idx_patients_mrn        ON patients(mrn);
CREATE INDEX IF NOT EXISTS idx_visits_patient      ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_status       ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_created_at   ON visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_visit ON prescriptions(visit_id);

-- Triggers
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at
  BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Token auto-assign: COUNT today's visits + 1
CREATE OR REPLACE FUNCTION assign_next_token()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COUNT(*) + 1
  INTO NEW.token_number
  FROM visits
  WHERE created_at >= CURRENT_DATE::TIMESTAMPTZ
    AND created_at <  (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assign_token_trigger
  BEFORE INSERT ON visits FOR EACH ROW EXECUTE FUNCTION assign_next_token();

-- Seed medicines
INSERT INTO medicines (name, generic_name, dosage_form, strength, category) VALUES
  ('Paracetamol',  'Acetaminophen', 'tablet',  '500mg',  'Analgesic'),
  ('Ibuprofen',    'Ibuprofen',     'tablet',  '400mg',  'NSAID'),
  ('Amoxicillin',  'Amoxicillin',   'capsule', '250mg',  'Antibiotic'),
  ('Omeprazole',   'Omeprazole',    'capsule', '20mg',   'PPI'),
  ('Metformin',    'Metformin',     'tablet',  '500mg',  'Antidiabetic'),
  ('Cetirizine',   'Cetirizine',    'tablet',  '10mg',   'Antihistamine'),
  ('Salbutamol',   'Albuterol',     'inhaler', '100mcg', 'Bronchodilator'),
  ('Azithromycin', 'Azithromycin',  'tablet',  '500mg',  'Antibiotic'),
  ('Pantoprazole', 'Pantoprazole',  'tablet',  '40mg',   'PPI'),
  ('Atorvastatin', 'Atorvastatin',  'tablet',  '20mg',   'Statin');
