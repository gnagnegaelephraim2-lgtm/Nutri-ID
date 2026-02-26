use axum::{routing::get, Json, Router};
use crate::models::record::{HealthRecord, CreateRecordRequest};
use uuid::Uuid;

pub fn router() -> Router {
    Router::new()
        .route("/", get(list_records).post(create_record))
}

// In real app, these handlers would take a DB connection pool extension
async fn list_records() -> Json<Vec<HealthRecord>> {
    // Simulate fetching records
    let mock_record = HealthRecord {
        id: Uuid::new_v4(),
        patient_id: Uuid::new_v4(),
        doctor_id: Some(Uuid::new_v4()),
        record_type: "PRESCRIPTION".to_string(),
        ipfs_cid: "QmTest123".to_string(),
        document_hash: "0xABCDEF".to_string(),
        blockchain_tx_hash: None,
        created_at: Some(chrono::Utc::now()),
    };

    Json(vec![mock_record])
}

async fn create_record(Json(payload): Json<CreateRecordRequest>) -> Json<HealthRecord> {
    let mock_record = HealthRecord {
        id: Uuid::new_v4(),
        patient_id: payload.patient_id,
        doctor_id: Some(Uuid::new_v4()), // from JWT auth user context
        record_type: payload.record_type,
        ipfs_cid: payload.ipfs_cid,
        document_hash: payload.document_hash,
        blockchain_tx_hash: None,
        created_at: Some(chrono::Utc::now()),
    };
    
    Json(mock_record)
}
