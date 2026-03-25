-- =====================================================
-- Platform schema — clinic_platform database
-- KEEP THIS FILE UP TO DATE with every column/table change.
-- For a fresh database, run:
--   psql -U postgres -d clinic_platform -f platform-schema.sql
-- For existing databases, use the "Run Migrations" button in the admin panel.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Registry of all clinics (tenants)
CREATE TABLE IF NOT EXISTS clinics (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              TEXT        UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9_]+$'),
  name              TEXT        NOT NULL,
  phone             TEXT,
  address           TEXT,
  website           TEXT,
  max_doctors       INTEGER     NOT NULL DEFAULT 5,
  max_receptionists INTEGER     NOT NULL DEFAULT 5,
  status            TEXT        NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'paused', 'deleted')),
  plan              TEXT        NOT NULL DEFAULT 'active',
  trial_expires_at  TIMESTAMPTZ,
  payment_notes     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- All users across all clinics
CREATE TABLE IF NOT EXISTS clinic_users (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id        UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  email            TEXT        NOT NULL UNIQUE,
  password_hash    TEXT        NOT NULL,
  role             TEXT        NOT NULL CHECK (role IN ('doctor', 'receptionist', 'clinic_admin')),
  full_name        TEXT        NOT NULL,
  specialization   TEXT,
  credentials      TEXT,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  session_version  INTEGER     NOT NULL DEFAULT 0,
  display_password TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_users_email     ON clinic_users(email);
CREATE INDEX IF NOT EXISTS idx_clinic_users_clinic_id ON clinic_users(clinic_id);

-- Receptionist ↔ Doctor allocation (many-to-many)
CREATE TABLE IF NOT EXISTS receptionist_doctors (
  receptionist_id UUID NOT NULL REFERENCES clinic_users(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES clinic_users(id) ON DELETE CASCADE,
  PRIMARY KEY (receptionist_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_rd_receptionist ON receptionist_doctors(receptionist_id);
CREATE INDEX IF NOT EXISTS idx_rd_doctor       ON receptionist_doctors(doctor_id);

-- Platform notifications sent to clinic users by admin
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id  UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  type       TEXT        NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'urgent')),
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_clinic_id ON notifications(clinic_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created   ON notifications(created_at DESC);

-- Grant clinic_app access (DDL operations use adminPool)
GRANT SELECT ON clinics TO clinic_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON clinic_users         TO clinic_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON receptionist_doctors TO clinic_app;
GRANT SELECT, UPDATE ON notifications TO clinic_app;
