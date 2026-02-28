use serde::{Deserialize, Serialize};
use jsonwebtoken::{encode, EncodingKey, Header};
use uuid::Uuid;
use std::env;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,          // User ID
    pub role: String,       // PATIENT, DOCTOR, ADMIN
    pub exp: usize,         // Expiration time
}

// Secret key for JWT (In production, read from env)
fn jwt_secret() -> String {
    env::var("JWT_SECRET").unwrap_or_else(|_| "super_secret_nutri_id_key_for_dev_only".to_string())
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
        let auth_header = parts.headers.get(axum::http::header::AUTHORIZATION)
            .and_then(|value| value.to_str().ok())
            .unwrap_or_default();

        if !auth_header.starts_with("Bearer ") {
            return Err((axum::http::StatusCode::UNAUTHORIZED, "Missing or invalid Authorization header".to_string()));
        }

        let token = &auth_header["Bearer ".len()..];

        verify_jwt(token).map_err(|e| {
            (axum::http::StatusCode::UNAUTHORIZED, format!("Invalid token: {}", e))
        })
    }
}
