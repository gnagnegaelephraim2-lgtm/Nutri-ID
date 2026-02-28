-- Add more comprehensive medical fields
ALTER TABLE patients ADD COLUMN date_of_birth TEXT;
ALTER TABLE patients ADD COLUMN sex TEXT;
ALTER TABLE patients ADD COLUMN height REAL;
ALTER TABLE patients ADD COLUMN weight REAL;
ALTER TABLE patients ADD COLUMN allergies TEXT;
ALTER TABLE patients ADD COLUMN emergency_contact TEXT;
