use axum::{
    extract::State,
    http::StatusCode,
    routing::post,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{SqlitePool, Row};
use uuid::Uuid;

pub type DbPool = SqlitePool;

#[derive(Deserialize)]
pub struct LoginPayload {
    email: String,
    password: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    token: String,
    role: String,
}

pub fn router() -> Router<SqlitePool> {
    Router::new()
        .route("/login", post(login_handler))
        .route("/register", post(register_handler))
        .route("/me", axum::routing::get(me_handler))
}

#[derive(Serialize)]
pub struct UserProfile {
    id: String,
    email: String,
    role: String,
    full_name: Option<String>,
    blood_type: Option<String>,
}

type ApiError = (StatusCode, Json<serde_json::Value>);

fn api_err(code: StatusCode, msg: &str) -> ApiError {
    (code, Json(serde_json::json!({"error": msg})))
}

/// GET /api/auth/me — returns current user profile from JWT
async fn me_handler(
    claims: crate::auth::Claims,
    State(pool): State<SqlitePool>,
) -> Result<Json<UserProfile>, ApiError> {
    let id_str = claims.sub.to_string();
    let row = sqlx::query(
        r#"
        SELECT u.id, u.email, u.role, p.full_name, p.blood_type
        FROM users u
        LEFT JOIN patients p ON u.id = p.user_id
        WHERE u.id = ?
        "#
    )
    .bind(&id_str)
    .fetch_optional(&pool)
    .await
    .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    let row = row.ok_or_else(|| api_err(StatusCode::NOT_FOUND, "User not found"))?;

    Ok(Json(UserProfile {
        id: row.try_get("id").unwrap_or_default(),
        email: row.try_get("email").unwrap_or_default(),
        role: row.try_get("role").unwrap_or_default(),
        full_name: row.try_get("full_name").ok(),
        blood_type: row.try_get("blood_type").ok(),
    }))
}

/// POST /api/auth/login — validates credentials against DB, returns JWT
async fn login_handler(
    State(pool): State<SqlitePool>,
    Json(payload): Json<LoginPayload>,
) -> Result<Json<AuthResponse>, ApiError> {
    let row = sqlx::query(
        "SELECT id, password_hash, role FROM users WHERE email = ?"
    )
    .bind(&payload.email)
    .fetch_optional(&pool)
    .await
    .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    let row = match row {
        Some(r) => r,
        None => return Err(api_err(StatusCode::UNAUTHORIZED, "Invalid email or password")),
    };

    let id_str: String = row.try_get("id").map_err(|e: sqlx::Error| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let hash: String = row.try_get("password_hash").map_err(|e: sqlx::Error| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let role: String = row.try_get("role").map_err(|e: sqlx::Error| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    // Parse UUID from stored TEXT
    let id = Uuid::parse_str(&id_str).map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    // Verify bcrypt password hash
    let valid = bcrypt::verify(&payload.password, &hash)
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    if !valid {
        return Err(api_err(StatusCode::UNAUTHORIZED, "Invalid email or password"));
    }

    let token = crate::auth::create_jwt(id, &role);
    Ok(Json(AuthResponse { token, role }))
}

#[derive(Deserialize)]
pub struct RegisterPayload {
    email: String,
    password: String,
    role: Option<String>,
    full_name: Option<String>,
    blood_type: Option<String>,
    national_id: Option<String>,
}

/// POST /api/auth/register — hashes password and inserts user into DB
async fn register_handler(
    State(pool): State<SqlitePool>,
    Json(payload): Json<RegisterPayload>,
) -> Result<Json<AuthResponse>, ApiError> {
    let role = payload.role.unwrap_or_else(|| "PATIENT".to_string());

    // Hash password with bcrypt cost factor 12
    let hash = bcrypt::hash(&payload.password, 12)
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    // Generate UUID as string for SQLite
    let id = Uuid::new_v4();
    let id_str = id.to_string();

    let mut tx = pool.begin().await.map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    sqlx::query(
        "INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)"
    )
    .bind(&id_str)
    .bind(&payload.email)
    .bind(&hash)
    .bind(&role)
    .execute(&mut *tx)
    .await
    .map_err(|e| {
        if e.to_string().contains("UNIQUE constraint") {
            api_err(StatusCode::CONFLICT, "Email already registered")
        } else {
            api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string())
        }
    })?;

    if role == "PATIENT" {
        let name = payload.full_name.unwrap_or_else(|| "Nouveau Patient".to_string());
        
        let nip = match payload.national_id {
            Some(n) if !n.trim().is_empty() => n,
            _ => format!("CI-TEMP-{}", &Uuid::new_v4().to_string()[..8].to_uppercase()),
        };

        sqlx::query(
            "INSERT INTO patients (user_id, full_name, national_id, blood_type) VALUES (?, ?, ?, ?)"
        )
        .bind(&id_str)
        .bind(name)
        .bind(nip)
        .bind(&payload.blood_type)
        .execute(&mut *tx)
        .await
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    }

    tx.commit().await.map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    let token = crate::auth::create_jwt(id, &role);
    Ok(Json(AuthResponse { token, role }))
}
