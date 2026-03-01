use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::{
    auth::Claims,
    models::teleconsult::{
        CreateTeleconsultPayload, Teleconsultation, UpdateTeleconsultStatusPayload,
    },
};
use serde_json::json;

pub fn router() -> Router<SqlitePool> {
    Router::new()
        .route(
            "/",
            post(create_teleconsult_handler).get(get_my_teleconsults_handler),
        )
        .route("/:id", get(get_teleconsult_by_id_handler))
        .route(
            "/:id/status",
            axum::routing::put(update_teleconsult_status_handler),
        )
        .route_layer(axum::middleware::from_extractor::<Claims>())
}

async fn create_teleconsult_handler(
    State(pool): State<SqlitePool>,
    claims: Claims,
    Json(payload): Json<CreateTeleconsultPayload>,
) -> Result<Json<Teleconsultation>, (StatusCode, Json<serde_json::Value>)> {
    let new_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    // Default status is 'pending' when requested by a patient
    let patient_id_str = claims.sub.to_string();
    let result = sqlx::query_as::<_, Teleconsultation>(
        r#"
        INSERT INTO teleconsultations (id, patient_id, doctor_id, scheduled_at, status, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
        RETURNING *
        "#,
    )
    .bind(&new_id)
    .bind(&patient_id_str) // JWT subject is the user/patient ID
    .bind(&payload.doctor_id)
    .bind(&payload.scheduled_at)
    .bind(&payload.notes)
    .bind(&now)
    .bind(&now)
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to create teleconsultation: {}", e) })),
        )
    })?;

    Ok(Json(result))
}

async fn get_my_teleconsults_handler(
    State(pool): State<SqlitePool>,
    claims: Claims,
) -> Result<Json<Vec<Teleconsultation>>, (StatusCode, Json<serde_json::Value>)> {
    let patient_id_str = claims.sub.to_string();
    // Only fetch consultations where the logged-in user is the patient
    let consults = sqlx::query_as::<_, Teleconsultation>(
        "SELECT * FROM teleconsultations WHERE patient_id = ? ORDER BY scheduled_at DESC",
    )
    .bind(&patient_id_str)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to fetch teleconsultations: {}", e) })),
        )
    })?;

    Ok(Json(consults))
}

async fn get_teleconsult_by_id_handler(
    State(pool): State<SqlitePool>,
    Path(id): Path<String>,
    claims: Claims,
) -> Result<Json<Teleconsultation>, (StatusCode, Json<serde_json::Value>)> {
    let patient_id_str = claims.sub.to_string();
    let consult = sqlx::query_as::<_, Teleconsultation>(
        "SELECT * FROM teleconsultations WHERE id = ? AND patient_id = ?",
    )
    .bind(&id)
    .bind(&patient_id_str) // Security: Ensure user can only view their own
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Database error: {}", e) })),
        )
    })?;

    match consult {
        Some(c) => Ok(Json(c)),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Consultation not found" })),
        )),
    }
}

async fn update_teleconsult_status_handler(
    State(pool): State<SqlitePool>,
    Path(id): Path<String>,
    claims: Claims,
    Json(payload): Json<UpdateTeleconsultStatusPayload>,
) -> Result<Json<Teleconsultation>, (StatusCode, Json<serde_json::Value>)> {
    let now = chrono::Utc::now().to_rfc3339();

    // Ensure status is valid
    let valid_statuses = ["pending", "confirmed", "completed", "canceled"];
    if !valid_statuses.contains(&payload.status.as_str()) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Invalid status value" })),
        ));
    }

    // Usually, patients would only be allowed to 'cancel' from 'pending' state.
    let patient_id_str = claims.sub.to_string();
    let result = sqlx::query_as::<_, Teleconsultation>(
        r#"
        UPDATE teleconsultations 
        SET status = ?, meeting_link = COALESCE(?, meeting_link), notes = COALESCE(?, notes), updated_at = ?
        WHERE id = ? AND patient_id = ?
        RETURNING *
        "#,
    )
    .bind(&payload.status)
    .bind(&payload.meeting_link)
    .bind(&payload.notes)
    .bind(&now)
    .bind(&id)
    .bind(&patient_id_str) // Security: ensure they own the consultation
    .fetch_optional(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to update teleconsultation: {}", e) })),
        )
    })?;

    match result {
        Some(c) => Ok(Json(c)),
        None => Err((
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Consultation not found or unauthorized to update" })),
        )),
    }
}
