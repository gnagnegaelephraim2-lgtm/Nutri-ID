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
