use axum::{extract::State, http::StatusCode, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use uuid::Uuid;

use crate::middleware::rate_limit::auth_rate_limit;

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
    // /login and /register are rate-limited; authenticated routes are not
    let rate_limited = Router::new()
        .route("/login", post(login_handler))
        .route("/register", post(register_handler))
        .layer(axum::middleware::from_fn(auth_rate_limit));

    Router::new()
        .merge(rate_limited)
        .route("/me", axum::routing::get(me_handler))
        .route("/me/update", axum::routing::put(update_me_handler))
        .route("/me/password", axum::routing::put(change_password_handler))
        .route("/forgot-password", post(forgot_password_handler))
        .route("/reset-password", post(reset_password_handler))
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
    cmu_active: Option<bool>,
    cmu_expiry_date: Option<String>,
    religion: Option<String>,
}

type ApiError = (StatusCode, Json<serde_json::Value>);

fn api_err(code: StatusCode, msg: &str) -> ApiError {
    (code, Json(serde_json::json!({"error": msg})))
}

fn is_valid_email(email: &str) -> bool {
    let mut parts = email.splitn(2, '@');
    let local = parts.next().unwrap_or("");
    let domain = parts.next().unwrap_or("");
    !local.is_empty() && domain.contains('.') && !domain.starts_with('.') && !domain.ends_with('.')
}

/// GET /api/auth/me — returns current user profile from JWT
async fn me_handler(
    claims: crate::auth::Claims,
    State(pool): State<SqlitePool>,
) -> Result<Json<UserProfile>, ApiError> {
    let id_str = claims.sub.to_string();
    let row = sqlx::query(
        r#"
        SELECT u.id, u.email, u.role,
               COALESCE(p.full_name, d.full_name) AS full_name,
               p.national_id, p.blood_type,
               p.date_of_birth, p.sex, p.height, p.weight, p.allergies, p.emergency_contact,
               p.cmu_active, p.cmu_expiry_date, p.religion
        FROM users u
        LEFT JOIN patients p ON u.id = p.user_id
        LEFT JOIN doctors d ON u.id = d.user_id
        WHERE u.id = ?
        "#,
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
        cmu_active: row.try_get("cmu_active").ok(),
        cmu_expiry_date: row.try_get("cmu_expiry_date").ok(),
        religion: row.try_get("religion").ok(),
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
    pub religion: Option<String>,
}

/// PUT /api/auth/me/update — update user profile fields, returns updated UserProfile
async fn update_me_handler(
    claims: crate::auth::Claims,
    State(pool): State<SqlitePool>,
    Json(payload): Json<UpdateProfilePayload>,
) -> Result<Json<UserProfile>, ApiError> {
    let id_str = claims.sub.to_string();

    let mut tx = pool
        .begin()
        .await
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    // We only update if the fields are provided.
    if let Some(name) = payload.full_name {
        // Update both tables — one will match (patient or doctor), the other is a no-op.
        sqlx::query("UPDATE patients SET full_name = ? WHERE user_id = ?")
            .bind(&name)
            .bind(&id_str)
            .execute(&mut *tx)
            .await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
        sqlx::query("UPDATE doctors SET full_name = ? WHERE user_id = ?")
            .bind(&name)
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
            .execute(&mut *tx)
            .await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    }

    if let Some(sex) = payload.sex {
        sqlx::query("UPDATE patients SET sex = ? WHERE user_id = ?")
            .bind(sex)
            .bind(&id_str)
            .execute(&mut *tx)
            .await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    }

    if let Some(height) = payload.height {
        sqlx::query("UPDATE patients SET height = ? WHERE user_id = ?")
            .bind(height)
            .bind(&id_str)
            .execute(&mut *tx)
            .await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    }

    if let Some(weight) = payload.weight {
        sqlx::query("UPDATE patients SET weight = ? WHERE user_id = ?")
            .bind(weight)
            .bind(&id_str)
            .execute(&mut *tx)
            .await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    }

    if let Some(allergies) = payload.allergies {
        sqlx::query("UPDATE patients SET allergies = ? WHERE user_id = ?")
            .bind(allergies)
            .bind(&id_str)
            .execute(&mut *tx)
            .await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    }

    if let Some(contact) = payload.emergency_contact {
        sqlx::query("UPDATE patients SET emergency_contact = ? WHERE user_id = ?")
            .bind(contact)
            .bind(&id_str)
            .execute(&mut *tx)
            .await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    }

    if let Some(religion) = payload.religion {
        sqlx::query("UPDATE patients SET religion = ? WHERE user_id = ?")
            .bind(religion)
            .bind(&id_str)
            .execute(&mut *tx)
            .await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    }

    tx.commit()
        .await
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    // Return the updated profile so the client can refresh state without an extra round-trip
    let row = sqlx::query(
        r#"
        SELECT u.id, u.email, u.role,
               COALESCE(p.full_name, d.full_name) AS full_name,
               p.national_id, p.blood_type,
               p.date_of_birth, p.sex, p.height, p.weight, p.allergies, p.emergency_contact,
               p.cmu_active, p.cmu_expiry_date, p.religion
        FROM users u
        LEFT JOIN patients p ON u.id = p.user_id
        LEFT JOIN doctors d ON u.id = d.user_id
        WHERE u.id = ?
        "#,
    )
    .bind(&id_str)
    .fetch_one(&pool)
    .await
    .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

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
        cmu_active: row.try_get("cmu_active").ok(),
        cmu_expiry_date: row.try_get("cmu_expiry_date").ok(),
        religion: row.try_get("religion").ok(),
    }))
}

/// POST /api/auth/login — validates credentials against DB, returns JWT
async fn login_handler(
    State(pool): State<SqlitePool>,
    Json(payload): Json<LoginPayload>,
) -> Result<Json<AuthResponse>, ApiError> {
    let row = sqlx::query("SELECT id, password_hash, role FROM users WHERE email = ?")
        .bind(&payload.email)
        .fetch_optional(&pool)
        .await
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    let row = match row {
        Some(r) => r,
        None => {
            return Err(api_err(
                StatusCode::UNAUTHORIZED,
                "Invalid email or password",
            ))
        }
    };

    let id_str: String = row
        .try_get("id")
        .map_err(|e: sqlx::Error| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let hash: String = row
        .try_get("password_hash")
        .map_err(|e: sqlx::Error| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    let role: String = row
        .try_get("role")
        .map_err(|e: sqlx::Error| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    // Parse UUID from stored TEXT
    let id = Uuid::parse_str(&id_str)
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    // Verify bcrypt password hash
    let valid = bcrypt::verify(&payload.password, &hash)
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    if !valid {
        return Err(api_err(
            StatusCode::UNAUTHORIZED,
            "Invalid email or password",
        ));
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
    // Doctor-specific fields
    license_number: Option<String>,
    specialty: Option<String>,
    facility_name: Option<String>,
}

/// POST /api/auth/register — hashes password and inserts user into DB
async fn register_handler(
    State(pool): State<SqlitePool>,
    Json(payload): Json<RegisterPayload>,
) -> Result<Json<AuthResponse>, ApiError> {
    if !is_valid_email(&payload.email) {
        return Err(api_err(StatusCode::BAD_REQUEST, "Adresse email invalide"));
    }
    if payload.password.len() < 8 {
        return Err(api_err(
            StatusCode::BAD_REQUEST,
            "Le mot de passe doit contenir au moins 8 caractères",
        ));
    }

    let role = payload.role.unwrap_or_else(|| "PATIENT".to_string());

    // Hash password with bcrypt cost factor 12
    let hash = bcrypt::hash(&payload.password, 12)
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    // Generate UUID as string for SQLite
    let id = Uuid::new_v4();
    let id_str = id.to_string();

    let mut tx = pool
        .begin()
        .await
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    sqlx::query("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)")
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
        let name = payload
            .full_name
            .unwrap_or_else(|| "Nouveau Patient".to_string());

        let nip = match payload.national_id {
            Some(n) if !n.trim().is_empty() => n,
            _ => format!(
                "CI-TEMP-{}",
                &Uuid::new_v4().to_string()[..8].to_uppercase()
            ),
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
    } else if role == "DOCTOR" {
        let name = payload
            .full_name
            .unwrap_or_else(|| "Nouveau Médecin".to_string());

        let license = match payload.license_number {
            Some(l) if !l.trim().is_empty() => l,
            _ => format!(
                "CI-MED-TEMP-{}",
                &Uuid::new_v4().to_string()[..8].to_uppercase()
            ),
        };

        sqlx::query(
            "INSERT INTO doctors (user_id, full_name, license_number, specialty, facility_name) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(&id_str)
        .bind(name)
        .bind(license)
        .bind(&payload.specialty)
        .bind(&payload.facility_name)
        .execute(&mut *tx)
        .await
        .map_err(|e| {
            if e.to_string().contains("UNIQUE constraint") {
                api_err(StatusCode::CONFLICT, "License number already registered")
            } else {
                api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string())
            }
        })?;
    }

    tx.commit()
        .await
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    let token = crate::auth::create_jwt(id, &role);
    Ok(Json(AuthResponse { token, role }))
}

#[derive(Deserialize)]
pub struct ChangePasswordPayload {
    current_password: String,
    new_password: String,
}

/// PUT /api/auth/me/password — verifies current password then updates to new hash
async fn change_password_handler(
    claims: crate::auth::Claims,
    State(pool): State<SqlitePool>,
    Json(payload): Json<ChangePasswordPayload>,
) -> Result<Json<serde_json::Value>, ApiError> {
    if payload.new_password.len() < 8 {
        return Err(api_err(
            StatusCode::BAD_REQUEST,
            "New password must be at least 8 characters",
        ));
    }

    let id_str = claims.sub.to_string();

    let row = sqlx::query("SELECT password_hash FROM users WHERE id = ?")
        .bind(&id_str)
        .fetch_optional(&pool)
        .await
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?
        .ok_or_else(|| api_err(StatusCode::NOT_FOUND, "User not found"))?;

    let current_hash: String = row
        .try_get("password_hash")
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    let valid = bcrypt::verify(&payload.current_password, &current_hash)
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    if !valid {
        return Err(api_err(
            StatusCode::UNAUTHORIZED,
            "Mot de passe actuel incorrect",
        ));
    }

    let new_hash = bcrypt::hash(&payload.new_password, 12)
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    sqlx::query("UPDATE users SET password_hash = ? WHERE id = ?")
        .bind(&new_hash)
        .bind(&id_str)
        .execute(&pool)
        .await
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    Ok(Json(
        serde_json::json!({ "message": "Mot de passe mis à jour avec succès" }),
    ))
}

// ─── Password Reset ────────────────────────────────────────────────────────

#[derive(Deserialize)]
pub struct ForgotPasswordPayload {
    email: String,
}

/// POST /api/auth/forgot-password
/// Creates a 15-minute reset token for the given email.
/// In production this token would be delivered via email/SMS; here it is
/// returned in the response body so the frontend can link directly to the
/// reset page (suitable while no email service is configured).
async fn forgot_password_handler(
    State(pool): State<SqlitePool>,
    Json(payload): Json<ForgotPasswordPayload>,
) -> Result<Json<serde_json::Value>, ApiError> {
    // Look up user — return a generic success even if not found to prevent
    // email enumeration attacks.
    let row = sqlx::query("SELECT id FROM users WHERE email = ?")
        .bind(&payload.email)
        .fetch_optional(&pool)
        .await
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    let Some(row) = row else {
        return Ok(Json(serde_json::json!({
            "message": "Si cet email existe, un lien de réinitialisation a été envoyé."
        })));
    };

    let user_id: String = row
        .try_get("id")
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    // Generate a 256-bit hex token (two UUIDs concatenated, hyphens stripped)
    let token = format!(
        "{}{}",
        Uuid::new_v4().to_string().replace('-', ""),
        Uuid::new_v4().to_string().replace('-', "")
    );

    let expires_at = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::minutes(15))
        .expect("valid timestamp")
        .to_rfc3339();

    // Invalidate any previous unused tokens for this user
    sqlx::query("UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0")
        .bind(&user_id)
        .execute(&pool)
        .await
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    sqlx::query("INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)")
        .bind(&token)
        .bind(&user_id)
        .bind(&expires_at)
        .execute(&pool)
        .await
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    tracing::info!("Password reset token for {}: {}", payload.email, token);

    Ok(Json(serde_json::json!({
        "message": "Si cet email existe, un lien de réinitialisation a été envoyé.",
        // TODO: remove `reset_token` once an email service is wired up
        "reset_token": token
    })))
}

#[derive(Deserialize)]
pub struct ResetPasswordPayload {
    token: String,
    new_password: String,
}

/// POST /api/auth/reset-password
/// Validates the token, updates the password, and marks the token as used.
async fn reset_password_handler(
    State(pool): State<SqlitePool>,
    Json(payload): Json<ResetPasswordPayload>,
) -> Result<Json<serde_json::Value>, ApiError> {
    if payload.new_password.len() < 8 {
        return Err(api_err(
            StatusCode::BAD_REQUEST,
            "Le nouveau mot de passe doit contenir au moins 8 caractères.",
        ));
    }

    let row =
        sqlx::query("SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = ?")
            .bind(&payload.token)
            .fetch_optional(&pool)
            .await
            .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?
            .ok_or_else(|| {
                api_err(
                    StatusCode::BAD_REQUEST,
                    "Lien de réinitialisation invalide.",
                )
            })?;

    let used: i64 = row
        .try_get("used")
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;
    if used != 0 {
        return Err(api_err(
            StatusCode::BAD_REQUEST,
            "Ce lien a déjà été utilisé.",
        ));
    }

    let expires_at_str: String = row
        .try_get("expires_at")
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    let expires_at = chrono::DateTime::parse_from_rfc3339(&expires_at_str).map_err(|_| {
        api_err(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Invalid token expiry format",
        )
    })?;

    if chrono::Utc::now() > expires_at {
        return Err(api_err(
            StatusCode::BAD_REQUEST,
            "Ce lien a expiré. Veuillez en demander un nouveau.",
        ));
    }

    let user_id: String = row
        .try_get("user_id")
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    let new_hash = bcrypt::hash(&payload.new_password, 12)
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    let mut tx = pool
        .begin()
        .await
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    sqlx::query("UPDATE users SET password_hash = ? WHERE id = ?")
        .bind(&new_hash)
        .bind(&user_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    sqlx::query("UPDATE password_reset_tokens SET used = 1 WHERE token = ?")
        .bind(&payload.token)
        .execute(&mut *tx)
        .await
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    tx.commit()
        .await
        .map_err(|e| api_err(StatusCode::INTERNAL_SERVER_ERROR, &e.to_string()))?;

    Ok(Json(
        serde_json::json!({ "message": "Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter." }),
    ))
}
