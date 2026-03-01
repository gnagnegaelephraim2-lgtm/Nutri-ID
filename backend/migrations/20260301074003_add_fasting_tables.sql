-- Fasting Plans Table
CREATE TABLE IF NOT EXISTS fasting_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    fast_type TEXT NOT NULL, -- e.g., 'ramadan', 'lent', 'intermittent', 'daniel', 'custom'
    title TEXT,
    start_date TEXT NOT NULL, -- YYYY-MM-DD
    end_date TEXT,            -- YYYY-MM-DD
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'canceled'
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Fasting Logs Table (Daily tracker)
CREATE TABLE IF NOT EXISTS fasting_logs (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    status TEXT NOT NULL, -- e.g., 'success', 'skipped', 'partial'
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (plan_id) REFERENCES fasting_plans (id) ON DELETE CASCADE
);

-- Index for quickly fetching logs by plan/date
CREATE UNIQUE INDEX IF NOT EXISTS idx_fasting_logs_plan_date ON fasting_logs (plan_id, date);
