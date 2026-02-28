use crate::blockchain::{has_health_id, mint_health_id, BlockchainConfig, MintResult};
use axum::{routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

pub fn router() -> Router<SqlitePool> {
    Router::new()
        .route("/mint", post(handle_mint))
        .route("/check", post(handle_check))
}

/// Request body for minting a HealthID SBT.
#[derive(Deserialize)]
pub struct MintRequest {
    /// Patient's Polygon wallet address (0x...)
    pub wallet_address: String,
    /// Patient's national identification number
    pub nip: String,
}

/// Response wrapper for mint operations.
#[derive(Serialize)]
pub struct MintResponse {
    pub success: bool,
    pub data: Option<MintResult>,
    pub error: Option<String>,
}

/// Request body for checking if an address already has a HealthID.
#[derive(Deserialize)]
pub struct CheckRequest {
    pub wallet_address: String,
}

/// Response for health ID existence check.
#[derive(Serialize)]
pub struct CheckResponse {
    pub wallet_address: String,
    pub has_health_id: bool,
}

/// POST /api/blockchain/mint
/// Mints a new non-transferable HealthID SBT on Polygon for the given patient.
async fn handle_mint(Json(payload): Json<MintRequest>) -> Json<MintResponse> {
    if payload.wallet_address.is_empty() || payload.nip.is_empty() {
        return Json(MintResponse {
            success: false,
            data: None,
            error: Some("wallet_address and nip are required".to_string()),
        });
    }

    let config = BlockchainConfig::from_env();

    // Check for double-mint before sending a transaction
    match has_health_id(&config, &payload.wallet_address).await {
        Ok(true) => {
            return Json(MintResponse {
                success: false,
                data: None,
                error: Some(format!(
                    "Address {} already holds a HealthID SBT. Soulbound tokens cannot be re-minted.",
                    payload.wallet_address
                )),
            });
        }
        Err(e) => {
            tracing::warn!("Could not verify HealthID existence (proceeding): {}", e);
        }
        Ok(false) => {}
    }

    match mint_health_id(&config, &payload.wallet_address, &payload.nip).await {
        Ok(result) => Json(MintResponse {
            success: true,
            data: Some(result),
            error: None,
        }),
        Err(e) => {
            tracing::error!("Mint failed: {}", e);
            Json(MintResponse {
                success: false,
                data: None,
                error: Some(format!("Blockchain transaction failed: {}", e)),
            })
        }
    }
}

/// POST /api/blockchain/check
/// Checks whether a wallet address already owns a HealthID SBT.
async fn handle_check(Json(payload): Json<CheckRequest>) -> Json<CheckResponse> {
    let config = BlockchainConfig::from_env();
    let exists = has_health_id(&config, &payload.wallet_address)
        .await
        .unwrap_or(false);

    Json(CheckResponse {
        wallet_address: payload.wallet_address,
        has_health_id: exists,
    })
}
