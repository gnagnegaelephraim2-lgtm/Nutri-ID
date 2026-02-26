pub mod auth_routes;
pub mod records_routes;
pub mod blockchain_routes;

use axum::Router;

pub fn app_router() -> Router {
    Router::new()
        .nest("/api/auth", auth_routes::router())
        .nest("/api/records", records_routes::router())
        .nest("/api/blockchain", blockchain_routes::router())
}

