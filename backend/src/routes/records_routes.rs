use axum::{
    extract::State,
    http::StatusCode,
    routing::get,
    Json, Router,
};
use sqlx::{SqlitePool, Row};
use crate::models::record::{HealthRecord, CreateRecordRequest};
use uuid::Uuid;

pub fn router() -> Router<SqlitePool> {
    Router::new()
        .route("/", get(list_records).post(create_record))
}

/// GET /api/records — returns health records
async fn list_records(
    State(pool): State<SqlitePool>,
) -> Result<Json<Vec<HealthRecord>>, (StatusCode, String)> {
    let rows = sqlx::query(
        r#"
        SELECT id, patient_id, doctor_id, record_type,
               ipfs_cid, document_hash, blockchain_tx_hash, created_at
        FROM health_records
        ORDER BY created_at DESC
        LIMIT 100
        "#
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let records = rows.iter().map(|r| HealthRecord {
        id:                 r.try_get("id").unwrap_or_default(),
        patient_id:         r.try_get("patient_id").unwrap_or_default(),
        doctor_id:          r.try_get("doctor_id").ok(),
        record_type:        r.try_get("record_type").unwrap_or_default(),
        ipfs_cid:           r.try_get("ipfs_cid").unwrap_or_default(),
        document_hash:      r.try_get("document_hash").unwrap_or_default(),
        blockchain_tx_hash: r.try_get("blockchain_tx_hash").ok(),
        created_at:         r.try_get("created_at").ok(),
    }).collect::<Vec<_>>();

    Ok(Json(records))
}

/// POST /api/records — creates a new health record
async fn create_record(
    State(pool): State<SqlitePool>,
    Json(payload): Json<CreateRecordRequest>,
) -> Result<Json<HealthRecord>, (StatusCode, String)> {
    let id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO health_records (id, patient_id, record_type, ipfs_cid, document_hash) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&payload.patient_id)
    .bind(&payload.record_type)
    .bind(&payload.ipfs_cid)
    .bind(&payload.document_hash)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(HealthRecord {
        id,
        patient_id: payload.patient_id,
        doctor_id: None,
        record_type: payload.record_type,
        ipfs_cid: payload.ipfs_cid,
        document_hash: payload.document_hash,
        blockchain_tx_hash: None,
        created_at: None,
    }))
}
