use sqlx::{SqlitePool, sqlite::SqlitePoolOptions};
use std::env;

pub type DbPool = SqlitePool;

pub async fn init_db() -> Result<SqlitePool, sqlx::Error> {
    // Default to a local file — no installation needed
    let db_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:./nutriid.db?mode=rwc".to_string());

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    // Run embedded migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    tracing::info!("✅ SQLite DB connected at: {}", db_url);
    Ok(pool)
}
