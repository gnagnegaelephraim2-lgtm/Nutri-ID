use axum::{routing::post, Json, Router};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct AuthPayload {
    email: String,
    password: String,
}

#[derive(Serialize)]
pub struct AuthResponse {
    token: String,
    role: String,
}

pub fn router() -> Router {
    Router::new()
        .route("/login", post(login_handler))
}

async fn login_handler(Json(payload): Json<AuthPayload>) -> Json<AuthResponse> {
    // In a real app, verify password hash from DB
    // Here we simulate Doctor vs Patient authentication
    
    let role = if payload.email.contains("doctor") {
        "DOCTOR"
    } else {
        "PATIENT"
    };

    // Simulated user ID
    let user_id = uuid::Uuid::new_v4();
    let token = crate::auth::create_jwt(user_id, role);

    Json(AuthResponse {
        token,
        role: role.to_string(),
    })
}
