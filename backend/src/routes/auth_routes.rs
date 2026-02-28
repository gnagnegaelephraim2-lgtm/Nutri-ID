use axum::{
    extract::State,
    http::StatusCode,
    routing::post,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{SqlitePool, Row};
use uuid::Uuid;

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
        .route("/me/update", axum::routing::put(update_me_handler))
}

#[derive(Serialize)]
pub struct UserProfile {
    id: String,
    email: String,
    role: String,
    full_name: Option<String>,
    blood_type: Option<String>,
    national_id: Option<String>,
    date_of_birth: Option<String>,
    sex: Option<String>,
    height: Option<f64>,
    weight: Option<f64>,
    allergies: Option<String>,
    emergency_contact: Option<String>,
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
        SELECT u.id, u.email, u.role, p.full_name, p.national_id, p.blood_type,
               p.date_of_birth, p.sex, p.height, p.weight, p.allergies, p.emergency_contact
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
        national_id: row.try_get("national_id").ok(),
        date_of_birth: row.try_get("date_of_birth").ok(),
        sex: row.try_get("sex").ok(),
        height: row.try_get("height").ok(),
        weight: row.try_get("weight").ok(),
        allergies: row.try_get("allergies").ok(),
        emergency_contact: row.try_get("emergency_contact").ok(),
    }))
}

#[derive(Deserialize)]
pub struct UpdateProfilePayload {
    pub full_name: Option<String>,
    pub blood_type: Option<String>,
    pub national_id: Option<String>,
    pub date_of_birth: Option<String>,
    pub sex: Option<String>,
    pub height: Option<f64>,
    pub weight: Option<f64>,
    pub allergies: Option<String>,
    pub emergency_contact: Option<String>,
}

/// PUT /api/auth/me/update — update user profile fields
async fn update_me_handler(
    claims: crate::auth::Claims,
    State(pool): State<SqlitePool>,
    Json(payload): Json<UpdateProfilePayload>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let id_str = claims.sub.to_string();

    let mut tx = pool.begin().await.map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    // We only update if the fields are provided.
    if let Some(name) = payload.full_name {
        sqlx::query("UPDATE patients SET full_name = ? WHERE user_id = ?")
            .bind(name)
            .bind(&id_str)
            .execute(&mut *tx)
            .await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    }

    if let Some(blood) = payload.blood_type {
        sqlx::query("UPDATE patients SET blood_type = ? WHERE user_id = ?")
            .bind(blood)
            .bind(&id_str)
            .execute(&mut *tx)
            .await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    }

    if let Some(nip) = payload.national_id {
        sqlx::query("UPDATE patients SET national_id = ? WHERE user_id = ?")
            .bind(nip)
            .bind(&id_str)
            .execute(&mut *tx)
            .await
            .map_err(|e| {
                if e.to_string().contains("UNIQUE constraint") {
                    api_err(StatusCode::CONFLICT, "NIP already used")
                } else {
                    api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string())
                }
            })?;
    }

    if let Some(dob) = payload.date_of_birth {
        sqlx::query("UPDATE patients SET date_of_birth = ? WHERE user_id = ?")
            .bind(dob)
            .bind(&id_str)
            .execute(&mut *tx).await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    }

    if let Some(sex) = payload.sex {
        sqlx::query("UPDATE patients SET sex = ? WHERE user_id = ?")
            .bind(sex)
            .bind(&id_str)
            .execute(&mut *tx).await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    }

    if let Some(height) = payload.height {
        sqlx::query("UPDATE patients SET height = ? WHERE user_id = ?")
            .bind(height)
            .bind(&id_str)
            .execute(&mut *tx).await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    }

    if let Some(weight) = payload.weight {
        sqlx::query("UPDATE patients SET weight = ? WHERE user_id = ?")
            .bind(weight)
            .bind(&id_str)
            .execute(&mut *tx).await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    }

    if let Some(allergies) = payload.allergies {
        sqlx::query("UPDATE patients SET allergies = ? WHERE user_id = ?")
            .bind(allergies)
            .bind(&id_str)
            .execute(&mut *tx).await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    }

    if let Some(contact) = payload.emergency_contact {
        sqlx::query("UPDATE patients SET emergency_contact = ? WHERE user_id = ?")
            .bind(contact)
            .bind(&id_str)
            .execute(&mut *tx).await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    }

    tx.commit().await.map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    Ok(Json(serde_json::json!({ "message": "Profile updated successfully" })))
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
