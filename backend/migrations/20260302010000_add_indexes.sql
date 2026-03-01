-- Performance indexes for hot query paths

-- nutrition_logs: patient timeline and today-calorie aggregation
CREATE INDEX IF NOT EXISTS idx_nutrition_patient ON nutrition_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_logged_at ON nutrition_logs(patient_id, logged_at);

-- health_records: per-patient listing
CREATE INDEX IF NOT EXISTS idx_records_patient ON health_records(patient_id);

-- fasting_plans: per-user listing and active-plan filter
CREATE INDEX IF NOT EXISTS idx_fasting_plans_user ON fasting_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_fasting_plans_user_status ON fasting_plans(user_id, status);

-- Prevent duplicate active plans of the same type per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_fasting_plans_active_type
    ON fasting_plans(user_id, fast_type)
    WHERE status = 'active';
