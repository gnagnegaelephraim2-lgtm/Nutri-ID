use jsonwebtoken::{encode, EncodingKey, Header};
use serde::{Deserialize, Serialize};
use std::env;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,    // User ID
    pub role: String, // PATIENT, DOCTOR, ADMIN
    pub exp: usize,   // Expiration time
}

/// Returns the JWT signing secret.
/// In development (RUST_ENV=dev or unset), falls back to a local dev key.
/// In production (RUST_ENV=production), panics immediately if JWT_SECRET is not set
/// so the service never starts with a known-weak key.
fn jwt_secret() -> String {
    match env::var("JWT_SECRET") {
        Ok(secret) if !secret.is_empty() => secret,
        _ => {
            let is_prod = env::var("RUST_ENV")
                .map(|v| v == "production")
                .unwrap_or(false);
            if is_prod {
                panic!(
                    "FATAL: JWT_SECRET env var is not set. \
                     Refusing to start in production without a secure signing key."
                );
            }
            "super_secret_nutri_id_key_for_dev_only".to_string()
        }
    }
}

pub fn create_jwt(user_id: Uuid, role: &str) -> String {
    let expiration = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::hours(24))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user_id,
        role: role.to_string(),
        exp: expiration,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret().as_bytes()),
    )
    .unwrap()
}

pub fn verify_jwt(token: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
    let mut validation = jsonwebtoken::Validation::default();
    validation.validate_exp = true;

    let token_data = jsonwebtoken::decode::<Claims>(
        token,
        &jsonwebtoken::DecodingKey::from_secret(jwt_secret().as_bytes()),
        &validation,
    )?;

    Ok(token_data.claims)
}

// Implement Axum's FromRequestParts to automatically extract and verify JWT claims from headers
#[axum::async_trait]
impl<S> axum::extract::FromRequestParts<S> for Claims
where
    S: Send + Sync,
{
    type Rejection = (axum::http::StatusCode, String);

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .unwrap_or_default();

        if !auth_header.starts_with("Bearer ") {
            return Err((
                axum::http::StatusCode::UNAUTHORIZED,
                "Missing or invalid Authorization header".to_string(),
            ));
        }

        let token = &auth_header["Bearer ".len()..];

        verify_jwt(token).map_err(|e| {
            (
                axum::http::StatusCode::UNAUTHORIZED,
                format!("Invalid token: {}", e),
            )
        })
    }
}
