use crate::auth::Claims;
use crate::models::vaccine::{CreateVaccineRequest, Vaccine};
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

pub fn router() -> Router<SqlitePool> {
    Router::new().route("/", get(list_vaccines).post(create_vaccine))
}

/// GET /api/vaccines — returns vaccine records for the authenticated patient
async fn list_vaccines(
    claims: Claims,
    State(pool): State<SqlitePool>,
) -> Result<Json<Vec<Vaccine>>, (StatusCode, String)> {
    let patient_id = claims.sub.to_string();
    let rows = sqlx::query(
        r#"
        SELECT id, patient_id, vaccine_name, dose, administered_at,
               facility_name, next_dose_at, created_at
        FROM vaccines
        WHERE patient_id = ?
        ORDER BY administered_at DESC
        "#,
    )
    .bind(&patient_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let vaccines = rows
        .iter()
        .map(|r| Vaccine {
            id: r.try_get("id").unwrap_or_default(),
            patient_id: r.try_get("patient_id").unwrap_or_default(),
            vaccine_name: r.try_get("vaccine_name").unwrap_or_default(),
            dose: r.try_get("dose").unwrap_or_default(),
            administered_at: r.try_get("administered_at").unwrap_or_default(),
            facility_name: r.try_get("facility_name").ok().flatten(),
            next_dose_at: r.try_get("next_dose_at").ok().flatten(),
            created_at: r.try_get("created_at").ok(),
        })
        .collect();

    Ok(Json(vaccines))
}

/// POST /api/vaccines — records a vaccine for the authenticated patient
async fn create_vaccine(
    claims: Claims,
    State(pool): State<SqlitePool>,
    Json(payload): Json<CreateVaccineRequest>,
) -> Result<Json<Vaccine>, (StatusCode, String)> {
    let id = Uuid::new_v4().to_string();
    let patient_id = claims.sub.to_string();

    sqlx::query(
        r#"INSERT INTO vaccines
           (id, patient_id, vaccine_name, dose, administered_at, facility_name, next_dose_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)"#,
    )
    .bind(&id)
    .bind(&patient_id)
    .bind(&payload.vaccine_name)
    .bind(&payload.dose)
    .bind(&payload.administered_at)
    .bind(&payload.facility_name)
    .bind(&payload.next_dose_at)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(Vaccine {
        id,
        patient_id,
        vaccine_name: payload.vaccine_name,
        dose: payload.dose,
        administered_at: payload.administered_at,
        facility_name: payload.facility_name,
        next_dose_at: payload.next_dose_at,
        created_at: None,
    }))
}
