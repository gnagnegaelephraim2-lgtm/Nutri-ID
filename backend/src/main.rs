use axum::{routing::get, Extension, Json, Router};
use serde::Serialize;
use std::net::SocketAddr;
use std::time::Duration;
use tower_http::cors::{AllowOrigin, Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod auth;
mod blockchain;
mod db;
mod middleware;
mod models;
mod routes;

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
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "nutriid_backend=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Initialize Database pool and run migrations
    let pool = db::init_db()
        .await
        .expect("Failed to connect to SQLite. Check DATABASE_URL in .env");
    tracing::info!("✅ Database connected and migrations applied.");

    // In production set ALLOWED_ORIGIN=https://nutriid.ci; falls back to Any in dev.
    let cors = match std::env::var("ALLOWED_ORIGIN") {
        Ok(origin) => {
            let header_val = origin
                .parse::<axum::http::HeaderValue>()
                .expect("ALLOWED_ORIGIN must be a valid HTTP header value");
            CorsLayer::new()
                .allow_origin(AllowOrigin::exact(header_val))
                .allow_methods(Any)
                .allow_headers(Any)
        }
        Err(_) => CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any),
    };

    // Rate limiter: 10 auth attempts per IP per 60 seconds
    let auth_rate_limiter = middleware::rate_limit::RateLimiter::new(10, Duration::from_secs(60));

    // Merge routers with shared DB pool state
    let app = Router::new()
        .route("/api/health", get(health_check))
        .merge(routes::app_router())
        .with_state(pool)
        .layer(Extension(auth_rate_limiter))
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::info!("🚀 Nutri-ID backend listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
