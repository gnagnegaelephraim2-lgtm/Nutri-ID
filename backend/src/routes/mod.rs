pub mod ai_routes;
pub mod auth_routes;
pub mod blockchain_routes;
pub mod dashboard_routes;
pub mod nutrition_routes;
pub mod records_routes;
pub mod teleconsult_routes;
pub mod vaccines_routes;
pub mod fasting_routes;

use axum::{routing::get, Json, Router};
use serde_json::json;
use sqlx::SqlitePool;

pub fn app_router() -> Router<SqlitePool> {
    Router::new()
        .nest("/api/auth", auth_routes::router())
        .nest("/api/dashboard", dashboard_routes::router())
        .nest("/api/records", records_routes::router())
        .nest("/api/blockchain", blockchain_routes::router())
        .nest("/api/ai", ai_routes::router())
        .nest("/api/nutrition", nutrition_routes::router())
        .nest("/api/vaccines", vaccines_routes::router())
        .nest("/api/teleconsults", teleconsult_routes::router())
        .nest("/api/fasting", fasting_routes::router())
}


