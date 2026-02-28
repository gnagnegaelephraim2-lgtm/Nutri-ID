use crate::auth::Claims;
use crate::models::nutrition::{CreateNutritionLogRequest, NutritionLog};
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

pub fn router() -> Router<SqlitePool> {
    Router::new().route("/", get(list_logs).post(create_log))
}

/// GET /api/nutrition — returns nutrition logs for the authenticated patient (JWT required)
async fn list_logs(
    claims: Claims,
    State(pool): State<SqlitePool>,
) -> Result<Json<Vec<NutritionLog>>, (StatusCode, String)> {
    let patient_id = claims.sub.to_string();
    let rows = sqlx::query(
        r#"
        SELECT id, patient_id, meal_name, proteins, carbs, fats, logged_at
        FROM nutrition_logs
        WHERE patient_id = ?
        ORDER BY logged_at DESC
        LIMIT 100
        "#,
    )
    .bind(&patient_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let logs = rows
        .iter()
        .map(|r| {
            let proteins: f64 = r.try_get("proteins").unwrap_or(0.0);
            let carbs: f64 = r.try_get("carbs").unwrap_or(0.0);
            let fats: f64 = r.try_get("fats").unwrap_or(0.0);
            NutritionLog {
                id: r.try_get("id").unwrap_or_default(),
                patient_id: r.try_get("patient_id").unwrap_or_default(),
                meal_name: r.try_get("meal_name").unwrap_or_default(),
                proteins,
                carbs,
                fats,
                calories: proteins * 4.0 + carbs * 4.0 + fats * 9.0,
                logged_at: r.try_get("logged_at").ok(),
            }
        })
        .collect::<Vec<_>>();

    Ok(Json(logs))
}

/// POST /api/nutrition — logs a meal for the authenticated patient (JWT required)
async fn create_log(
    claims: Claims,
    State(pool): State<SqlitePool>,
    Json(payload): Json<CreateNutritionLogRequest>,
) -> Result<Json<NutritionLog>, (StatusCode, String)> {
    let id = Uuid::new_v4().to_string();
    let patient_id = claims.sub.to_string();
    let calories = payload.proteins * 4.0 + payload.carbs * 4.0 + payload.fats * 9.0;

    sqlx::query(
        "INSERT INTO nutrition_logs (id, patient_id, meal_name, proteins, carbs, fats) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&patient_id)
    .bind(&payload.meal_name)
    .bind(payload.proteins)
    .bind(payload.carbs)
    .bind(payload.fats)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(NutritionLog {
        id,
        patient_id,
        meal_name: payload.meal_name,
        proteins: payload.proteins,
        carbs: payload.carbs,
        fats: payload.fats,
        calories,
        logged_at: None,
    }))
}
