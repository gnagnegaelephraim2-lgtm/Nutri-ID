-- Initial schema for Nutri-ID Backend (SQLite compatible)

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,           -- UUID stored as TEXT in SQLite
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'PATIENT',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS patients (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    national_id TEXT UNIQUE NOT NULL,
    blood_type TEXT,
    cmu_active INTEGER DEFAULT 0,  -- SQLite uses 0/1 for booleans
    wallet_address TEXT,
    health_id_token TEXT
);

CREATE TABLE IF NOT EXISTS doctors (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    specialty TEXT,
    facility_name TEXT
);

CREATE TABLE IF NOT EXISTS health_records (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    doctor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    record_type TEXT NOT NULL,
    ipfs_cid TEXT NOT NULL,
    document_hash TEXT NOT NULL,
    blockchain_tx_hash TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS nutrition_logs (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    meal_name TEXT NOT NULL,
    proteins REAL NOT NULL,
    carbs REAL NOT NULL,
    fats REAL NOT NULL,
    logged_at TEXT DEFAULT (datetime('now'))
);
