use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::post,
    Json, Router,
};
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::{
    auth::Claims,
    models::fasting::{
        CreateFastingPlanPayload, FastingLog, FastingPlan, UpdateFastingLogPayload,
    },
};
use serde_json::json;

pub fn router() -> Router<SqlitePool> {
    Router::new()
        .route(
            "/plans",
            post(create_fasting_plan_handler).get(get_my_fasting_plans_handler),
        )
        .route(
            "/plans/:plan_id/logs",
            post(update_fasting_log_handler).get(get_fasting_logs_handler),
        )
        .route_layer(axum::middleware::from_extractor::<Claims>())
}

async fn create_fasting_plan_handler(
    State(pool): State<SqlitePool>,
    claims: Claims,
    Json(payload): Json<CreateFastingPlanPayload>,
) -> Result<Json<FastingPlan>, (StatusCode, Json<serde_json::Value>)> {
    let new_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let user_id_str = claims.sub.to_string();

    let result = sqlx::query_as::<_, FastingPlan>(
        r#"
        INSERT INTO fasting_plans (id, user_id, fast_type, title, start_date, end_date, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
        RETURNING *
        "#,
    )
    .bind(&new_id)
    .bind(&user_id_str)
    .bind(&payload.fast_type)
    .bind(&payload.title)
    .bind(&payload.start_date)
    .bind(&payload.end_date)
    .bind(&now)
    .bind(&now)
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to create fasting plan: {}", e) })),
        )
    })?;

    Ok(Json(result))
}

async fn get_my_fasting_plans_handler(
    State(pool): State<SqlitePool>,
    claims: Claims,
) -> Result<Json<Vec<FastingPlan>>, (StatusCode, Json<serde_json::Value>)> {
    let user_id_str = claims.sub.to_string();
    let plans = sqlx::query_as::<_, FastingPlan>(
        "SELECT * FROM fasting_plans WHERE user_id = ? ORDER BY created_at DESC",
    )
    .bind(&user_id_str)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to fetch fasting plans: {}", e) })),
        )
    })?;

    Ok(Json(plans))
}

async fn update_fasting_log_handler(
    State(pool): State<SqlitePool>,
    Path(plan_id): Path<String>,
    claims: Claims,
    Json(payload): Json<UpdateFastingLogPayload>,
) -> Result<Json<FastingLog>, (StatusCode, Json<serde_json::Value>)> {
    let new_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let user_id_str = claims.sub.to_string();

    // Verify ownership of the plan
    let plan_exists = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM fasting_plans WHERE id = ? AND user_id = ?"
    )
    .bind(&plan_id)
    .bind(&user_id_str)
    .fetch_one(&pool)
    .await
    .unwrap_or(0);

    if plan_exists == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Fasting plan not found or unauthorized" })),
        ));
    }

    // Upsert the log for the specific date
    let result = sqlx::query_as::<_, FastingLog>(
        r#"
        INSERT INTO fasting_logs (id, plan_id, date, status, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(plan_id, date) DO UPDATE SET 
            status = excluded.status, 
            notes = excluded.notes, 
            updated_at = excluded.updated_at
        RETURNING *
        "#,
    )
    .bind(&new_id)
    .bind(&plan_id)
    .bind(&payload.date)
    .bind(&payload.status)
    .bind(&payload.notes)
    .bind(&now)
    .bind(&now)
    .fetch_one(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to log fasting day: {}", e) })),
        )
    })?;

    Ok(Json(result))
}

async fn get_fasting_logs_handler(
    State(pool): State<SqlitePool>,
    Path(plan_id): Path<String>,
    claims: Claims,
) -> Result<Json<Vec<FastingLog>>, (StatusCode, Json<serde_json::Value>)> {
    let user_id_str = claims.sub.to_string();

    // Verify ownership
    let plan_exists = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM fasting_plans WHERE id = ? AND user_id = ?"
    )
    .bind(&plan_id)
    .bind(&user_id_str)
    .fetch_one(&pool)
    .await
    .unwrap_or(0);

    if plan_exists == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "Fasting plan not found or unauthorized" })),
        ));
    }

    let logs = sqlx::query_as::<_, FastingLog>(
        "SELECT * FROM fasting_logs WHERE plan_id = ? ORDER BY date ASC",
    )
    .bind(&plan_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("Failed to fetch logs: {}", e) })),
        )
    })?;

    Ok(Json(logs))
}
