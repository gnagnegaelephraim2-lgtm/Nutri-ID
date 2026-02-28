use serde::{Deserialize, Serialize};

// SQLite-compatible: UUIDs as String, created_at as String
#[derive(Serialize, Deserialize)]
pub struct HealthRecord {
    pub id: String,
    pub patient_id: String,
    pub doctor_id: Option<String>,
    pub record_type: String,
    pub ipfs_cid: String,
    pub document_hash: String,
    pub blockchain_tx_hash: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct CreateRecordRequest {
    pub patient_id: String,
    pub record_type: String,
    pub ipfs_cid: String,
    pub document_hash: String,
}
