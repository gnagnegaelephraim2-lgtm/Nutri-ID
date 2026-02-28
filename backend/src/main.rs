use axum::{
    routing::get,
    Router, Json,
};
use serde::Serialize;
use std::net::SocketAddr;
use sqlx::SqlitePool;
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
    // Load .env file if present
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "nutriid_backend=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Initialize Database pool and run migrations
    let pool = db::init_db().await.expect(
        "Failed to connect to PostgreSQL. Is the database running? Check DATABASE_URL in .env"
    );
    tracing::info!("✅ Database connected and migrations applied.");

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Merge routers with shared DB pool state
    let app = Router::new()
        .route("/api/health", get(health_check))
        .merge(routes::app_router())
        .with_state(pool)
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    tracing::info!("🚀 Nutri-ID backend listening on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
