/// # Blockchain Module — Nutri-ID
/// Interacts with the HealthID.sol smart contract on Polygon Amoy via
/// raw Ethereum JSON-RPC calls over TCP. Uses only Rust std library + sha3 + k256.
///
/// ## Transaction Signing
/// Uses k256 (secp256k1 ECDSA, pure Rust) to sign EIP-155 legacy transactions
/// and submit them via eth_sendRawTransaction.
///
/// ## Production Note
/// This implementation handles HTTP (port 8545 / Hardhat). For HTTPS RPC providers
/// (Alchemy, Infura), add a TLS wrapper or use a backend proxy.
use anyhow::{Context, Result};
use k256::ecdsa::{signature::hazmat::PrehashSigner, RecoveryId, Signature, SigningKey};
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
    /// Deployed HealthID.sol contract address
    pub health_id_contract_address: String,
    /// Relayer private key (hex, with or without 0x prefix)
    pub relayer_private_key: String,
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
            relayer_private_key: std::env::var("RELAYER_PRIVATE_KEY").unwrap_or_else(|_| {
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
    let parts: Vec<&str> = host.rsplitn(2, ':').collect();
    let port: u16 = parts.first().and_then(|p| p.parse().ok()).unwrap_or(8545);
    let hostname = parts.get(1).copied().unwrap_or("127.0.0.1");

    let mut stream = TcpStream::connect(format!("{}:{}", hostname, port))
        .context("TCP connect to RPC host failed")?;
    stream.set_read_timeout(Some(Duration::from_secs(30))).ok();

    let request = format!(
        "POST / HTTP/1.0\r\nHost: {}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        host,
        body_json.len(),
        body_json
    );
    stream
        .write_all(request.as_bytes())
        .context("TCP write failed")?;

    let mut response = String::new();
    stream
        .read_to_string(&mut response)
        .context("TCP read failed")?;

    let body = response
        .split("\r\n\r\n")
        .nth(1)
        .ok_or_else(|| anyhow::anyhow!("Malformed HTTP response (no body)"))?;

    let parsed: JsonRpcResp =
        serde_json::from_str(body).context("JSON-RPC response parse failed")?;

    if let Some(err) = parsed.error {
        return Err(anyhow::anyhow!("Ethereum RPC error: {}", err));
    }

    parsed
        .result
        .ok_or_else(|| anyhow::anyhow!("RPC returned null result"))
}

fn send_rpc(host: &str, method: &str, params: serde_json::Value) -> Result<serde_json::Value> {
    let req = JsonRpcReq {
        jsonrpc: "2.0",
        method,
        params,
        id: 1,
    };
    let body = serde_json::to_string(&req).context("RPC serialize error")?;
    rpc_call_tcp(host, &body)
}

fn parse_hex_u64(hex_str: &str) -> Result<u64> {
    let s = hex_str.trim_start_matches("0x");
    u64::from_str_radix(if s.is_empty() { "0" } else { s }, 16)
        .context("Failed to parse hex integer")
}

// ─── Minimal RLP Encoder ──────────────────────────────────────────────────
//
// Reference: https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/

/// Returns the big-endian byte representation of `n`, with no leading zeros.
/// Returns an empty slice when n == 0.
fn be_minimal(n: u64) -> Vec<u8> {
    if n == 0 {
        return vec![];
    }
    let b = n.to_be_bytes();
    let start = b.iter().position(|&x| x != 0).unwrap_or(7);
    b[start..].to_vec()
}

/// RLP-encodes a byte string.
fn rlp_bytes(data: &[u8]) -> Vec<u8> {
    if data.len() == 1 && data[0] < 0x80 {
        // Single byte in [0x00, 0x7f] — encoded as itself
        return vec![data[0]];
    }
    let mut v = Vec::new();
    if data.len() <= 55 {
        v.push(0x80 + data.len() as u8);
    } else {
        let len_enc = be_minimal(data.len() as u64);
        v.push(0xb7 + len_enc.len() as u8);
        v.extend_from_slice(&len_enc);
    }
    v.extend_from_slice(data);
    v
}

/// RLP-encodes an unsigned 64-bit integer (as a big-endian minimal byte string).
fn rlp_u64(n: u64) -> Vec<u8> {
    rlp_bytes(&be_minimal(n))
}

/// RLP-encodes a list of already-encoded items.
fn rlp_list(items: &[Vec<u8>]) -> Vec<u8> {
    let payload: Vec<u8> = items.iter().flat_map(|i| i.iter().copied()).collect();
    let mut v = Vec::new();
    if payload.len() <= 55 {
        v.push(0xc0 + payload.len() as u8);
    } else {
        let len_enc = be_minimal(payload.len() as u64);
        v.push(0xf7 + len_enc.len() as u8);
        v.extend_from_slice(&len_enc);
    }
    v.extend(payload);
    v
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

// ─── Address Derivation ───────────────────────────────────────────────────

/// Derives the Ethereum address from a secp256k1 private key.
/// Address = last 20 bytes of Keccak256(uncompressed_pubkey[1..])
fn derive_address(private_key_hex: &str) -> String {
    let key_bytes = hex::decode(private_key_hex.trim_start_matches("0x")).unwrap_or_default();
    let signing_key = match SigningKey::try_from(key_bytes.as_slice()) {
        Ok(k) => k,
        Err(_) => return "0x0000000000000000000000000000000000000000".to_string(),
    };
    // Uncompressed pubkey: 0x04 || x (32 bytes) || y (32 bytes)
    let pubkey = signing_key.verifying_key().to_encoded_point(false);
    // Skip the 0x04 prefix; hash the 64-byte x||y
    let hash = Keccak256::digest(&pubkey.as_bytes()[1..]);
    format!("0x{}", hex::encode(&hash[12..]))
}

// ─── EIP-155 Legacy Transaction Signing ──────────────────────────────────

/// Signs an EIP-155 legacy Ethereum transaction and returns the RLP-encoded
/// raw transaction hex string (ready for eth_sendRawTransaction).
fn sign_legacy_tx(
    private_key_hex: &str,
    nonce: u64,
    gas_price: u64,
    gas_limit: u64,
    to: &str,
    value: u64,
    data: &[u8],
    chain_id: u64,
) -> Result<String> {
    let key_bytes =
        hex::decode(private_key_hex.trim_start_matches("0x")).context("Invalid private key hex")?;
    let signing_key = SigningKey::try_from(key_bytes.as_slice())
        .map_err(|e| anyhow::anyhow!("Invalid secp256k1 private key: {}", e))?;

    let to_bytes = hex::decode(to.trim_start_matches("0x")).context("Invalid 'to' address hex")?;
    anyhow::ensure!(to_bytes.len() == 20, "'to' address must be 20 bytes");

    // 1. RLP-encode the unsigned transaction with EIP-155 replay-protection fields
    //    Fields: [nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0]
    let unsigned_rlp = rlp_list(&[
        rlp_u64(nonce),
        rlp_u64(gas_price),
        rlp_u64(gas_limit),
        rlp_bytes(&to_bytes),
        rlp_u64(value),
        rlp_bytes(data),
        rlp_u64(chain_id),
        rlp_bytes(&[]), // r = 0
        rlp_bytes(&[]), // s = 0
    ]);

    // 2. Hash the unsigned transaction
    let hash = Keccak256::digest(&unsigned_rlp);

    // 3. Sign with secp256k1 ECDSA, recovering the recovery id
    let (sig, recid): (Signature, RecoveryId) = signing_key
        .sign_prehash(hash.as_ref())
        .map_err(|e| anyhow::anyhow!("ECDSA signing failed: {}", e))?;

    // 4. Extract r and s as 32-byte big-endian arrays
    let sig_bytes: [u8; 64] = sig.to_bytes().into();
    let r = &sig_bytes[..32];
    let s = &sig_bytes[32..];

    // 5. EIP-155: v = recovery_id + 35 + 2 * chain_id
    let v = recid.to_byte() as u64 + 35 + 2 * chain_id;

    // 6. RLP-encode the signed transaction
    //    Fields: [nonce, gasPrice, gasLimit, to, value, data, v, r, s]
    let signed_rlp = rlp_list(&[
        rlp_u64(nonce),
        rlp_u64(gas_price),
        rlp_u64(gas_limit),
        rlp_bytes(&to_bytes),
        rlp_u64(value),
        rlp_bytes(data),
        rlp_u64(v),
        rlp_bytes(r),
        rlp_bytes(s),
    ]);

    Ok(format!("0x{}", hex::encode(signed_rlp)))
}

// ─── Public API ────────────────────────────────────────────────────────────

/// Builds, signs, and submits a HealthID mint transaction via eth_sendRawTransaction.
pub async fn mint_health_id(
    config: &BlockchainConfig,
    recipient_address: &str,
    nip: &str,
) -> Result<MintResult> {
    let calldata_hex = calldata_mint(recipient_address, nip)?;
    let calldata_bytes =
        hex::decode(calldata_hex.trim_start_matches("0x")).context("calldata decode failed")?;

    let rpc_host = config.rpc_host.clone();
    let relayer_key = config.relayer_private_key.clone();
    let contract = config.health_id_contract_address.clone();

    let relayer_addr = derive_address(&relayer_key);
    tracing::info!(
        "🔗 Preparing HealthID mint | recipient={} | relayer={}",
        recipient_address,
        relayer_addr
    );

    // Fetch nonce, gas price, and chain ID from the node
    let rpc_host_c = rpc_host.clone();
    let relayer_addr_c = relayer_addr.clone();
    let (nonce, gas_price, chain_id) =
        tokio::task::spawn_blocking(move || -> Result<(u64, u64, u64)> {
            let nonce = parse_hex_u64(
                send_rpc(
                    &rpc_host_c,
                    "eth_getTransactionCount",
                    serde_json::json!([relayer_addr_c, "pending"]),
                )?
                .as_str()
                .unwrap_or("0x0"),
            )?;

            let gas_price = parse_hex_u64(
                send_rpc(&rpc_host_c, "eth_gasPrice", serde_json::json!([]))?
                    .as_str()
                    .unwrap_or("0x0"),
            )?;

            let chain_id = parse_hex_u64(
                send_rpc(&rpc_host_c, "eth_chainId", serde_json::json!([]))?
                    .as_str()
                    .unwrap_or("0x1"),
            )?;

            Ok((nonce, gas_price, chain_id))
        })
        .await
        .context("spawn_blocking failed")??;

    tracing::info!(
        "  nonce={} gas_price={} chain_id={}",
        nonce,
        gas_price,
        chain_id
    );

    // Sign the transaction
    let raw_tx = sign_legacy_tx(
        &relayer_key,
        nonce,
        gas_price,
        300_000, // gas limit — sufficient for SBT mint
        &contract,
        0, // value = 0 MATIC
        &calldata_bytes,
        chain_id,
    )?;

    // Submit via eth_sendRawTransaction
    let rpc_host_c = rpc_host.clone();
    let raw_tx_c = raw_tx.clone();
    let tx_hash_val = tokio::task::spawn_blocking(move || {
        send_rpc(
            &rpc_host_c,
            "eth_sendRawTransaction",
            serde_json::json!([raw_tx_c]),
        )
    })
    .await
    .context("spawn_blocking failed")??;

    let tx_hash = tx_hash_val
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("eth_sendRawTransaction returned non-string result"))?
        .to_string();

    tracing::info!(
        "✅ HealthID mint submitted | tx_hash={} | NIP={}",
        tx_hash,
        nip
    );

    Ok(MintResult {
        tx_hash,
        token_id: 0, // Retrieve from tx receipt if needed
        recipient: recipient_address.to_string(),
    })
}

/// Reads the hasHealthID state from the contract via eth_call.
pub async fn has_health_id(config: &BlockchainConfig, wallet_address: &str) -> Result<bool> {
    let calldata = calldata_has(wallet_address)?;
    let rpc_host = config.rpc_host.clone();
    let contract = config.health_id_contract_address.clone();

    let result = tokio::task::spawn_blocking(move || {
        send_rpc(
            &rpc_host,
            "eth_call",
            serde_json::json!([{"to": contract, "data": calldata}, "latest"]),
        )
    })
    .await
    .context("spawn_blocking failed")??;

    let hex_str = result.as_str().unwrap_or("0x").trim_start_matches("0x");
    if hex_str.is_empty() {
        return Ok(false);
    }
    let bytes = hex::decode(hex_str).unwrap_or_default();
    Ok(bytes.last().map(|&b| b != 0).unwrap_or(false))
}
