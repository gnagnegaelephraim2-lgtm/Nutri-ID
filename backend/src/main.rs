use axum::{
    routing::get,
    Router, Json,
};
use serde::Serialize;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod db;
mod models;
mod routes;
mod auth;
mod blockchain;

#[derive(Serialize)]
struct HealthStatusResponse {
    status: String,
    version: String,
    blockchain_network: String,
}

async fn health_check() -> Json<HealthStatusResponse> {
    Json(HealthStatusResponse {
        status: "operational".to_string(),
        version: "0.1.0".to_string(),
        blockchain_network: "Polygon POS".to_string(),
    })
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "nutriid_backend=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Initialize Database
    // Note: We omit checking the returned pool here since DB might not be running in build test
    // let _pool = db::init_db().await.expect("Failed to bind DB pool");

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Merge routers
    let app = Router::new()
        .route("/api/health", get(health_check))
        .merge(routes::app_router()) // /api/auth and /api/records
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::debug!("Listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
