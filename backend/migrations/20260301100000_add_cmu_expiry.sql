-- Add CMU expiry date to patient profiles
ALTER TABLE patients ADD COLUMN cmu_expiry_date TEXT;
