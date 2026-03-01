use crate::auth::Claims;
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use serde::Serialize;
use sqlx::{Row, SqlitePool};

pub fn router() -> Router<SqlitePool> {
    Router::new().route("/", get(dashboard_handler))
}

#[derive(Serialize)]
pub struct DashboardStats {
    pub record_count: i64,
    pub nutrition_logs_today: i64,
    pub calories_today: f64,
    pub last_meal: Option<String>,
    pub cmu_active: bool,
    pub full_name: Option<String>,
    pub blood_type: Option<String>,
}

async fn dashboard_handler(
    claims: Claims,
    State(pool): State<SqlitePool>,
) -> Result<Json<DashboardStats>, (StatusCode, String)> {
    let patient_id = claims.sub.to_string();
    let today = chrono::Utc::now().format("%Y-%m-%d").to_string();

    // Total health records for this patient
    let record_count: i64 =
        sqlx::query("SELECT COUNT(*) as cnt FROM health_records WHERE patient_id = ?")
            .bind(&patient_id)
            .fetch_one(&pool)
            .await
            .map(|r| r.try_get("cnt").unwrap_or(0))
            .unwrap_or(0);

    // Nutrition logs + kcal today
    let nutrition_row = sqlx::query(
        r#"
        SELECT COUNT(*) as cnt,
               COALESCE(SUM(proteins * 4.0 + carbs * 4.0 + fats * 9.0), 0.0) as kcal,
               (SELECT meal_name FROM nutrition_logs
                WHERE patient_id = ? AND date(logged_at) = ?
                ORDER BY logged_at DESC LIMIT 1) as last_meal
        FROM nutrition_logs
        WHERE patient_id = ? AND date(logged_at) = ?
        "#,
    )
    .bind(&patient_id)
    .bind(&today)
    .bind(&patient_id)
    .bind(&today)
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let nutrition_logs_today: i64 = nutrition_row.try_get("cnt").unwrap_or(0);
    let calories_today: f64 = nutrition_row.try_get("kcal").unwrap_or(0.0);
    let last_meal: Option<String> = nutrition_row.try_get("last_meal").ok().flatten();

    // CMU status + profile info
    let patient_row =
        sqlx::query("SELECT full_name, blood_type, cmu_active FROM patients WHERE user_id = ?")
            .bind(&patient_id)
            .fetch_optional(&pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let (cmu_active, full_name, blood_type) = if let Some(row) = patient_row {
        let cmu: i64 = row.try_get("cmu_active").unwrap_or(0);
        let name: Option<String> = row.try_get("full_name").ok();
        let blood: Option<String> = row.try_get("blood_type").ok();
        (cmu != 0, name, blood)
    } else {
        (false, None, None)
    };

    Ok(Json(DashboardStats {
        record_count,
        nutrition_logs_today,
        calories_today: (calories_today * 10.0).round() / 10.0,
        last_meal,
        cmu_active,
        full_name,
        blood_type,
    }))
}
