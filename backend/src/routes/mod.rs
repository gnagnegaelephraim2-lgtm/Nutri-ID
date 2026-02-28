pub mod ai_routes;
pub mod auth_routes;
pub mod blockchain_routes;
pub mod nutrition_routes;
pub mod records_routes;

use axum::{routing::get, Json, Router};
use serde_json::json;
use sqlx::SqlitePool;

pub fn app_router() -> Router<SqlitePool> {
    Router::new()
        .route("/api/health", get(health_handler))
        .nest("/api/auth", auth_routes::router())
        .nest("/api/records", records_routes::router())
        .nest("/api/blockchain", blockchain_routes::router())
        .nest("/api/ai", ai_routes::router())
        .nest("/api/nutrition", nutrition_routes::router())
}

async fn health_handler() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok", "service": "nutriid-backend" }))
}
