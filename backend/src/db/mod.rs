use sqlx::{postgres::PgPoolOptions, PgPool};
use std::env;

pub async fn init_db() -> Result<PgPool, sqlx::Error> {
    let database_url = env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://nutriid_admin:secure_password_123@localhost:5432/nutriid_national_db".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    // Run migrations automatically
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    Ok(pool)
}
