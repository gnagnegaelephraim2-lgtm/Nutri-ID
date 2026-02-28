pub mod auth_routes;
pub mod records_routes;
pub mod blockchain_routes;
pub mod ai_routes;

use axum::Router;
use sqlx::SqlitePool;

pub fn app_router() -> Router<SqlitePool> {
    Router::new()
        .nest("/api/auth", auth_routes::router())
        .nest("/api/records", records_routes::router())
        .nest("/api/blockchain", blockchain_routes::router())
        .nest("/api/ai", ai_routes::router())
}
