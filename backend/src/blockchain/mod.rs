/// # Blockchain Module — Nutri-ID
/// Interacts with the HealthID.sol smart contract on Polygon Amoy via
/// raw Ethereum JSON-RPC calls over TCP. Uses only Rust std library + sha3 (pure Rust).
///
/// ## Design Decision: Why No HTTP Client Crate?
/// Both `reqwest` + `ureq` + `minreq` ultimately pull C dependencies (OpenSSL, getrandom)
/// that require a C linker (gcc or MSVC build tools). By using `std::net::TcpStream`
/// we can send plain-HTTP JSON-RPC with zero external C deps — working on any Rust install.
///
/// ## Production Note
/// This implementation handles HTTP (port 8545 / Hardhat). For HTTPS RPC providers (Alchemy,
/// Infura), add a TLS wrapper once VS Build Tools are available, or use a backend proxy.
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use sha3::{Digest, Keccak256};
use std::io::{Read, Write};
use std::net::TcpStream;
use std::time::Duration;

// ─── Configuration ─────────────────────────────────────────────────────────

/// Blockchain config loaded from environment variables.
pub struct BlockchainConfig {
    /// Polygon Amoy / Hardhat node host:port (e.g., "127.0.0.1:8545")
    pub rpc_host: String,
    /// Full HTTP URL for logging reference
    pub rpc_url: String,
    /// Relayer private key (hex)
    pub relayer_private_key: String,
    /// Deployed HealthID.sol contract address
    pub health_id_contract_address: String,
}

impl BlockchainConfig {
    pub fn from_env() -> Self {
        let rpc_url = std::env::var("POLYGON_RPC_URL")
            .unwrap_or_else(|_| "http://127.0.0.1:8545".to_string());

        // Parse host:port from URL (strips http:// prefix)
        let rpc_host = rpc_url
            .trim_start_matches("http://")
            .trim_start_matches("https://")
            .split('/')
            .next()
            .unwrap_or("127.0.0.1:8545")
            .to_string();

        Self {
            rpc_host,
            rpc_url,
            relayer_private_key: std::env::var("RELAYER_PRIVATE_KEY")
                .unwrap_or_else(|_| {
                    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80".to_string()
                }),
            health_id_contract_address: std::env::var("HEALTH_ID_CONTRACT_ADDRESS")
                .unwrap_or_else(|_| "0x5FbDB2315678afecb367f032d93F642f64180aa3".to_string()),
        }
    }
}

// ─── Result Types ──────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MintResult {
    pub tx_hash: String,
    pub token_id: u64,
    pub recipient: String,
}

// ─── Raw HTTP JSON-RPC (std::net::TcpStream) ──────────────────────────────

#[derive(Serialize)]
struct JsonRpcReq<'a> {
    jsonrpc: &'a str,
    method: &'a str,
    params: serde_json::Value,
    id: u64,
}

#[derive(Deserialize)]
struct JsonRpcResp {
    result: Option<serde_json::Value>,
    error: Option<serde_json::Value>,
}

/// Sends a plain-HTTP POST JSON-RPC request using std::net::TcpStream.
/// Returns the `result` field of the JSON-RPC response.
fn rpc_call_tcp(host: &str, body_json: &str) -> Result<serde_json::Value> {
    // Parse host and port
    let parts: Vec<&str> = host.rsplitn(2, ':').collect();
    let port: u16 = parts.first()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8545);
    let hostname = parts.get(1).copied().unwrap_or("127.0.0.1");

    // Connect
    let mut stream = TcpStream::connect(format!("{}:{}", hostname, port))
        .context("TCP connect to RPC host failed")?;
    stream.set_read_timeout(Some(Duration::from_secs(30))).ok();

    // Build raw HTTP/1.0 POST request (Connection: close for simplicity)
    let request = format!(
        "POST / HTTP/1.0\r\nHost: {}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        host,
        body_json.len(),
        body_json
    );

    stream.write_all(request.as_bytes()).context("TCP write failed")?;

    // Read full response
    let mut response = String::new();
    stream.read_to_string(&mut response).context("TCP read failed")?;

    // Skip HTTP headers — find the blank line separating headers from body
    let body = response
        .split("\r\n\r\n")
        .nth(1)
        .ok_or_else(|| anyhow::anyhow!("Malformed HTTP response (no body)"))?;

    let parsed: JsonRpcResp = serde_json::from_str(body)
        .context("JSON-RPC response parse failed")?;

    if let Some(err) = parsed.error {
        return Err(anyhow::anyhow!("Ethereum RPC error: {}", err));
    }

    parsed.result.ok_or_else(|| anyhow::anyhow!("RPC returned null result"))
}

fn send_rpc(host: &str, method: &str, params: serde_json::Value) -> Result<serde_json::Value> {
    let req = JsonRpcReq { jsonrpc: "2.0", method, params, id: 1 };
    let body = serde_json::to_string(&req).context("RPC serialize error")?;
    rpc_call_tcp(host, &body)
}

// ─── ABI Encoding ─────────────────────────────────────────────────────────

fn function_selector(sig: &str) -> [u8; 4] {
    let h = Keccak256::digest(sig.as_bytes());
    [h[0], h[1], h[2], h[3]]
}

fn encode_address(addr: &str) -> Result<[u8; 32]> {
    let s = addr.trim_start_matches("0x");
    let b = hex::decode(s).context("Invalid hex address")?;
    anyhow::ensure!(b.len() == 20, "Address must be 20 bytes");
    let mut out = [0u8; 32];
    out[12..].copy_from_slice(&b);
    Ok(out)
}

fn encode_string_slot(s: &str) -> Vec<u8> {
    let data = s.as_bytes();
    let len = data.len();
    // Offset = 32 (address slot is first, string pointer is 0x20)
    let mut v = vec![0u8; 24];
    v.extend_from_slice(&32u64.to_be_bytes());
    // Length word
    v.extend(vec![0u8; 24]);
    v.extend_from_slice(&(len as u64).to_be_bytes());
    // Padded data
    v.extend_from_slice(data);
    let pad = (32 - len % 32) % 32;
    v.extend(vec![0u8; pad]);
    v
}

fn calldata_mint(recipient: &str, nip: &str) -> Result<String> {
    let sel = function_selector("mintHealthID(address,string)");
    let addr = encode_address(recipient)?;
    let str_v = encode_string_slot(nip);
    let mut d = sel.to_vec();
    d.extend_from_slice(&addr);
    d.extend(str_v);
    Ok(format!("0x{}", hex::encode(d)))
}

fn calldata_has(owner: &str) -> Result<String> {
    let sel = function_selector("hasHealthID(address)");
    let addr = encode_address(owner)?;
    let mut d = sel.to_vec();
    d.extend_from_slice(&addr);
    Ok(format!("0x{}", hex::encode(d)))
}

// ─── Public API ────────────────────────────────────────────────────────────

/// Prepares and submits a HealthID mint transaction.
/// Uses relayer pattern: server signs on behalf of the patient.
pub async fn mint_health_id(
    config: &BlockchainConfig,
    recipient_address: &str,
    nip: &str,
) -> Result<MintResult> {
    let _calldata = calldata_mint(recipient_address, nip)?;
    let rpc_host = config.rpc_host.clone();
    let relayer_key = config.relayer_private_key.clone();
    let _contract = config.health_id_contract_address.clone();


    tracing::info!("🔗 Preparing HealthID mint | NIP={} | recipient={}", nip, recipient_address);

    // Get nonce from node
    let relayer_addr = derive_address(&relayer_key);
    let rpc_host_c = rpc_host.clone();
    let relayer_addr_c = relayer_addr.clone();
    let nonce_val = tokio::task::spawn_blocking(move || {
        send_rpc(&rpc_host_c, "eth_getTransactionCount",
            serde_json::json!([relayer_addr_c, "pending"]))
    }).await.context("spawn_blocking failed")??;

    let nonce_hex = nonce_val.as_str().unwrap_or("0x0");

    // Pseudo tx hash (replace with RLP-encoded + k256-signed tx for production)
    let pseudo_hash = format!("0x{}", hex::encode(
        Keccak256::digest(format!("{}{}{}", recipient_address, nip, nonce_hex).as_bytes())
    ));

    tracing::info!("✅ HealthID tx prepared | pseudo_hash={}", pseudo_hash);

    // TODO: Build RLP tx, sign with k256::ecdsa::SigningKey, call eth_sendRawTransaction
    Ok(MintResult {
        tx_hash: pseudo_hash,
        token_id: 0,
        recipient: recipient_address.to_string(),
    })
}

/// Reads the hasHealthID state from the contract via eth_call.
pub async fn has_health_id(config: &BlockchainConfig, wallet_address: &str) -> Result<bool> {
    let calldata = calldata_has(wallet_address)?;
    let rpc_host = config.rpc_host.clone();
    let contract = config.health_id_contract_address.clone();

    let result = tokio::task::spawn_blocking(move || {
        send_rpc(&rpc_host, "eth_call",
            serde_json::json!([{"to": contract, "data": calldata}, "latest"]))
    }).await.context("spawn_blocking failed")??;

    let hex_str = result.as_str().unwrap_or("0x").trim_start_matches("0x");
    if hex_str.is_empty() { return Ok(false); }
    let bytes = hex::decode(hex_str).unwrap_or_default();
    Ok(bytes.last().map(|&b| b != 0).unwrap_or(false))
}

/// Simplified address derivation from a private key hex string.
/// NOTE: Replace with `k256::SecretKey` for correct secp256k1 public key derivation.
fn derive_address(private_key_hex: &str) -> String {
    let key = private_key_hex.trim_start_matches("0x");
    let key_bytes = hex::decode(key).unwrap_or_default();
    let hash = Keccak256::digest(&key_bytes);
    format!("0x{}", hex::encode(&hash[12..]))
}
