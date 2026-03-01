use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, sqlx::FromRow)]
pub struct FastingPlan {
    pub id: String,
    pub user_id: String,
    pub fast_type: String, // 'ramadan', 'lent', 'intermittent', 'daniel', 'custom'
    pub title: Option<String>,
    pub start_date: String,
    pub end_date: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, sqlx::FromRow)]
pub struct FastingLog {
    pub id: String,
    pub plan_id: String,
    pub date: String,
    pub status: String, // 'success', 'skipped', 'partial'
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Deserialize, Debug)]
pub struct CreateFastingPlanPayload {
    pub fast_type: String,
    pub title: Option<String>,
    pub start_date: String,
    pub end_date: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct UpdateFastingLogPayload {
    pub date: String,
    pub status: String,
    pub notes: Option<String>,
}
