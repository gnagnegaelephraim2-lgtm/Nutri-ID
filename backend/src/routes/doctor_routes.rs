use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use sqlx::{Row, SqlitePool};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::{
    auth::Claims,
    models::teleconsult::{TeleconsultationWithPatient, UpdateTeleconsultStatusPayload},
};

pub fn router() -> Router<SqlitePool> {
    // Public: list doctors for teleconsult booking (no auth required)
    let public = Router::new()
        .route("/list", get(list_doctors_handler));

    // Protected: doctor-scoped teleconsult management
    let protected = Router::new()
        .route("/teleconsults", get(get_doctor_teleconsults_handler))
        .route(
            "/teleconsults/:id/status",
            axum::routing::put(update_doctor_teleconsult_status_handler),
        )
        .route_layer(axum::middleware::from_extractor::<Claims>());

    Router::new().merge(public).merge(protected)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DoctorSummary {
    pub id: String,
    pub full_name: String,
    pub specialty: Option<String>,
    pub facility_name: Option<String>,
}

/// GET /api/doctor/list — public list of registered doctors for booking
async fn list_doctors_handler(
    State(pool): State<SqlitePool>,
) -> Result<Json<Vec<DoctorSummary>>, (StatusCode, Json<serde_json::Value>)> {
    let rows = sqlx::query(
        "SELECT u.id, d.full_name, d.specialty, d.facility_name \
         FROM doctors d JOIN users u ON d.user_id = u.id \
         ORDER BY d.full_name ASC",
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to list doctors: {}", e) })),
        )
    })?;

    let doctors = rows
        .iter()
        .map(|row| DoctorSummary {
            id: row.try_get("id").unwrap_or_default(),
            full_name: row.try_get("full_name").unwrap_or_default(),
            specialty: row.try_get("specialty").ok(),
            facility_name: row.try_get("facility_name").ok(),
        })
        .collect();

    Ok(Json(doctors))
}

/// GET /api/doctor/teleconsults — all consultations assigned to the logged-in doctor (with patient name)
async fn get_doctor_teleconsults_handler(
    State(pool): State<SqlitePool>,
    claims: Claims,
) -> Result<Json<Vec<TeleconsultationWithPatient>>, (StatusCode, Json<serde_json::Value>)> {
    if claims.role != "DOCTOR" {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({ "error": "Accès réservé aux médecins" })),
        ));
    }

    let doctor_id_str = claims.sub.to_string();
    let consults = sqlx::query_as::<_, TeleconsultationWithPatient>(
        r#"
        SELECT t.id, t.patient_id, u.full_name AS patient_name, t.doctor_id,
               t.scheduled_at, t.status, t.meeting_link, t.notes, t.created_at, t.updated_at
        FROM teleconsultations t
        LEFT JOIN users u ON t.patient_id = u.id
        WHERE t.doctor_id = ?
        ORDER BY t.scheduled_at ASC
        "#,
    )
    .bind(&doctor_id_str)
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

/// PUT /api/doctor/teleconsults/:id/status — doctor confirms or completes a consultation
async fn update_doctor_teleconsult_status_handler(
    State(pool): State<SqlitePool>,
    Path(id): Path<String>,
    claims: Claims,
    Json(payload): Json<UpdateTeleconsultStatusPayload>,
) -> Result<Json<TeleconsultationWithPatient>, (StatusCode, Json<serde_json::Value>)> {
    if claims.role != "DOCTOR" {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({ "error": "Accès réservé aux médecins" })),
        ));
    }

    let valid_statuses = ["confirmed", "completed", "canceled"];
    if !valid_statuses.contains(&payload.status.as_str()) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "Statut invalide. Valeurs acceptées: confirmed, completed, canceled" })),
        ));
    }

    let now = chrono::Utc::now().to_rfc3339();
    let doctor_id_str = claims.sub.to_string();

    // Update the row first
    let rows_affected = sqlx::query(
        "UPDATE teleconsultations \
         SET status = ?, meeting_link = COALESCE(?, meeting_link), notes = COALESCE(?, notes), updated_at = ? \
         WHERE id = ? AND doctor_id = ?",
    )
    .bind(&payload.status)
    .bind(&payload.meeting_link)
    .bind(&payload.notes)
    .bind(&now)
    .bind(&id)
    .bind(&doctor_id_str)
    .execute(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to update teleconsultation: {}", e) })),
        )
    })?
    .rows_affected();

    if rows_affected == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Consultation introuvable ou non autorisée" })),
        ));
    }

    // Fetch updated row with patient name via JOIN
    let consult = sqlx::query_as::<_, TeleconsultationWithPatient>(
        r#"
        SELECT t.id, t.patient_id, u.full_name AS patient_name, t.doctor_id,
               t.scheduled_at, t.status, t.meeting_link, t.notes, t.created_at, t.updated_at
        FROM teleconsultations t
        LEFT JOIN users u ON t.patient_id = u.id
        WHERE t.id = ?
        "#,
    )
    .bind(&id)
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to fetch updated teleconsultation: {}", e) })),
        )
    })?;

    Ok(Json(consult))
}
