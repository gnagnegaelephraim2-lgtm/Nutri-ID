#![allow(dead_code)]
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: String,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Serialize, Deserialize, FromRow)]
pub struct Patient {
    pub user_id: Uuid,
    pub full_name: String,
    pub national_id: String,
    pub blood_type: Option<String>,
    pub cmu_active: Option<bool>,
    pub wallet_address: Option<String>,
    pub health_id_token: Option<String>,
    pub religion: Option<String>,
}

#[derive(Serialize, Deserialize, FromRow)]
pub struct Doctor {
    pub user_id: Uuid,
    pub full_name: String,
    pub license_number: String,
    pub specialty: Option<String>,
    pub facility_name: Option<String>,
}
