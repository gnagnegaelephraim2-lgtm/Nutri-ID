-- Add migration script here
CREATE TABLE IF NOT EXISTS teleconsultations (
    id TEXT PRIMARY KEY NOT NULL,
    patient_id TEXT NOT NULL,
    doctor_id TEXT,
    scheduled_at DATETIME NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'canceled')),
    meeting_link TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    FOREIGN KEY (patient_id) REFERENCES patients (user_id) ON DELETE CASCADE

);

-- Optional: Create index for faster querying by user or status
CREATE INDEX IF NOT EXISTS idx_tele_patient ON teleconsultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_tele_doctor ON teleconsultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_tele_status ON teleconsultations(status);
