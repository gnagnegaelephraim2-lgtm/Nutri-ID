CREATE TABLE IF NOT EXISTS vaccines (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vaccine_name TEXT NOT NULL,
    dose TEXT NOT NULL DEFAULT '1',
    administered_at TEXT NOT NULL,
    facility_name TEXT,
    next_dose_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_vaccines_patient ON vaccines(patient_id);
