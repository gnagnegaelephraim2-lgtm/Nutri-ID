use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Serialize, Deserialize, FromRow)]
pub struct HealthRecord {
    pub id: Uuid,
    pub patient_id: Uuid,
    pub doctor_id: Option<Uuid>,
    pub record_type: String,
    pub ipfs_cid: String,
    pub document_hash: String,
    pub blockchain_tx_hash: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Serialize, Deserialize)]
pub struct CreateRecordRequest {
    pub patient_id: Uuid,
    pub record_type: String,
    pub ipfs_cid: String,
    pub document_hash: String,
}
