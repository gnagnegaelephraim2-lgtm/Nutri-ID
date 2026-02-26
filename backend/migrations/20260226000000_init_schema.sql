-- Initial schema for Nutri-ID Backend

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users schema (Patients, Doctors, Admins)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'PATIENT', -- PATIENT, DOCTOR, ADMIN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patients specific data
CREATE TABLE patients (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    national_id VARCHAR(100) UNIQUE NOT NULL, -- NIP
    blood_type VARCHAR(10),
    cmu_active BOOLEAN DEFAULT FALSE,
    wallet_address VARCHAR(42), -- Polygon address
    health_id_token VARCHAR(255) -- SBT Token ID
);

-- Doctors specific data
CREATE TABLE doctors (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialty VARCHAR(100),
    facility_name VARCHAR(255)
);

-- Health Records (on-chain hash, off-chain IPFS CID)
CREATE TABLE health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    record_type VARCHAR(50) NOT NULL, -- PRESCRIPTION, VACCINE, TEST_RESULT
    ipfs_cid VARCHAR(255) NOT NULL,
    document_hash VARCHAR(255) NOT NULL,
    blockchain_tx_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Nutrition Logs
CREATE TABLE nutrition_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    meal_name VARCHAR(255) NOT NULL,
    proteins REAL NOT NULL,
    carbs REAL NOT NULL,
    fats REAL NOT NULL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
