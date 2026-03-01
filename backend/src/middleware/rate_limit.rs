use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use axum::{
    body::Body,
    extract::Extension,
    http::{Request, StatusCode},
    middleware::Next,
    response::Response,
    Json,
};
use serde_json::json;

/// Simple sliding-window, in-memory rate limiter keyed by client IP string.
#[derive(Clone)]
pub struct RateLimiter {
    inner: Arc<Mutex<HashMap<String, Vec<Instant>>>>,
    max_requests: usize,
    window: Duration,
}

impl RateLimiter {
    pub fn new(max_requests: usize, window: Duration) -> Self {
        Self {
            inner: Arc::new(Mutex::new(HashMap::new())),
            max_requests,
            window,
        }
    }

    /// Returns true if the request from `ip` is within the allowed rate.
    fn is_allowed(&self, ip: &str) -> bool {
        let now = Instant::now();
        let mut map = self.inner.lock().unwrap();
        let timestamps = map.entry(ip.to_owned()).or_default();

        // Drop entries older than the window
        timestamps.retain(|&t| now.duration_since(t) < self.window);

        if timestamps.len() >= self.max_requests {
            false
        } else {
            timestamps.push(now);
            true
        }
    }
}

/// Extracts the real client IP from nginx-forwarded headers, falling back to
/// a fixed key ("unknown") so rate limiting still applies behind a proxy that
/// doesn't set these headers.
fn client_ip(req: &Request<Body>) -> String {
    req.headers()
        .get("x-real-ip")
        .or_else(|| req.headers().get("x-forwarded-for"))
        .and_then(|v| v.to_str().ok())
        .map(|s| s.split(',').next().unwrap_or(s).trim().to_owned())
        .unwrap_or_else(|| "unknown".to_owned())
}

/// Axum middleware: 10 requests / 60 s per IP on the auth routes.
/// Attach via `.layer(Extension(RateLimiter::new(10, Duration::from_secs(60))))`
/// and apply with `axum::middleware::from_fn(auth_rate_limit)`.
pub async fn auth_rate_limit(
    Extension(limiter): Extension<RateLimiter>,
    req: Request<Body>,
    next: Next,
) -> Result<Response, (StatusCode, Json<serde_json::Value>)> {
    let ip = client_ip(&req);
    if limiter.is_allowed(&ip) {
        Ok(next.run(req).await)
    } else {
        Err((
            StatusCode::TOO_MANY_REQUESTS,
            Json(json!({
                "error": "Trop de tentatives. Veuillez réessayer dans quelques minutes."
            })),
        ))
    }
}
