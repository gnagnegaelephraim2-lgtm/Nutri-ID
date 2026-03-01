/**
 * NUTRI-ID — IPFS / Pinata Integration Module
 *
 * Handles client-side encryption of health records and upload to IPFS via Pinata.
 * The actual medical data NEVER reaches the backend in plaintext —
 * it is AES-GCM encrypted in the browser, and only the IPFS CID (hash) is stored in PostgreSQL.
 *
 * ## Flow
 * 1. Doctor creates a health record (prescription, test result, etc.)
 * 2. This module encrypts the JSON data with AES-256-GCM using the patient's NIP as a key seed.
 * 3. The encrypted blob is uploaded to Pinata IPFS → returns a CID.
 * 4. The CID is sent to the Rust backend → stored in `health_records.ipfs_cid`.
 * 5. Optionally, the CID is also written to the `HealthRecord.sol` smart contract.
 *
 * IMPORTANT: For production, use a proper PKI system (asymmetric encryption) where only
 * the patient's private key can decrypt. This implementation uses symmetric AES-GCM
 * derived from the patient NIP (suitable for MVP / government prototype).
 */

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

/**
 * Derives a 256-bit AES key from a passphrase (patient NIP + salt) using PBKDF2.
 * @param {string} passphrase - The patient's NIP used as encryption seed.
 * @param {Uint8Array} salt - A random 16-byte salt.
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(passphrase, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(passphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * AES-256-GCM encrypts a JavaScript object.
 * @param {object} data - The health record object to encrypt.
 * @param {string} patientNip - Used to derive the encryption key.
 * @returns {Promise<{ciphertext: string, iv: string, salt: string}>} - Base64-encoded components.
 */
async function encryptRecord(data, patientNip) {
    const enc = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

    const key = await deriveKey(patientNip, salt);
    const plaintext = enc.encode(JSON.stringify(data));

    const cipherBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        plaintext
    );

    return {
        ciphertext: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer))),
        iv: btoa(String.fromCharCode(...iv)),
        salt: btoa(String.fromCharCode(...salt)),
        algorithm: 'AES-256-GCM',
        version: '1.0'
    };
}

/**
 * Decrypts a health record that was encrypted with `encryptRecord`.
 * @param {{ciphertext: string, iv: string, salt: string}} encryptedData
 * @param {string} patientNip
 * @returns {Promise<object>} - The original health record object.
 */
async function decryptRecord(encryptedData, patientNip) {
    const salt = Uint8Array.from(atob(encryptedData.salt), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
    const cipherBuffer = Uint8Array.from(atob(encryptedData.ciphertext), c => c.charCodeAt(0));

    const key = await deriveKey(patientNip, salt);
    const plainBuffer = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        cipherBuffer
    );

    const dec = new TextDecoder();
    return JSON.parse(dec.decode(plainBuffer));
}

/**
 * Uploads an encrypted health record to IPFS via Pinata.
 * @param {object} recordData - The plaintext health record (will be encrypted before upload).
 * @param {string} patientNip - Patient's NIP used for encryption key derivation.
 * @param {string} pinataApiKey - Pinata API key (set in .env / config).
 * @param {string} pinataSecretKey - Pinata secret API key.
 * @param {object} [metadata] - Optional IPFS metadata (name, keyvalues).
 * @returns {Promise<string>} - The IPFS CID (Content Identifier) of the uploaded file.
 */
async function uploadRecord(recordData, patientNip, pinataApiKey, pinataSecretKey, metadata = {}) {
    if (!patientNip) throw new Error('Patient NIP is required for encryption.');
    if (!pinataApiKey || !pinataSecretKey) throw new Error('Pinata API credentials are required.');

    // Step 1: Encrypt the record client-side before any upload
    const encrypted = await encryptRecord(recordData, patientNip);

    // Step 2: Prepare the IPFS payload with metadata
    const payload = {
        pinataMetadata: {
            name: metadata.name || `nutriid-record-${Date.now()}`,
            keyvalues: {
                system: 'nutri-id',
                country: 'CI',
                ...metadata.keyvalues
            }
        },
        pinataContent: {
            _encrypted: true,
            _system: 'Nutri-ID v1.0 — Ministère de la Santé CI',
            ...encrypted
        }
    };

    // Step 3: Upload to Pinata
    const response = await fetch(PINATA_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': pinataApiKey,
            'pinata_secret_api_key': pinataSecretKey,
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Pinata upload failed (${response.status}): ${errText}`);
    }

    const result = await response.json();
    const cid = result.IpfsHash;

    console.log(`✅ Record uploaded to IPFS: CID = ${cid}`);
    console.log(`🔗 View: ${IPFS_GATEWAY}${cid}`);

    return cid;
}

/**
 * Retrieves and decrypts a health record from IPFS by its CID.
 * @param {string} cid - The IPFS CID to fetch.
 * @param {string} patientNip - Used to derive the decryption key.
 * @returns {Promise<object>} - The decrypted health record.
 */
async function fetchRecord(cid, patientNip) {
    const response = await fetch(`${IPFS_GATEWAY}${cid}`);
    if (!response.ok) throw new Error(`IPFS fetch failed (${response.status})`);

    const encryptedData = await response.json();
    if (!encryptedData._encrypted) {
        throw new Error('Record does not appear to be encrypted with Nutri-ID format.');
    }

    return decryptRecord(encryptedData, patientNip);
}

/**
 * Saves the IPFS CID to the Nutri-ID backend database.
 * Call this after `uploadRecord` to persist the CID in the `health_records` table.
 * @param {object} recordPayload - Must include: patient_id, record_type, document_hash, ipfs_cid.
 * @param {string} jwtToken - The authenticated user's JWT token.
 * @param {string} [apiBase='http://localhost:3000'] - Backend API base URL.
 * @returns {Promise<object>} - The created health record from the backend.
 */
async function saveRecordToBackend(recordPayload, jwtToken, apiBase = 'http://localhost:3000') {
    const response = await fetch(`${apiBase}/api/records`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(recordPayload)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Backend record save failed (${response.status}): ${err}`);
    }

    return response.json();
}

/**
 * Full pipeline: encrypt → upload to IPFS → save CID to backend → return CID.
 * This is the main function to call from the UI when creating a new record.
 *
 * @param {object} recordData - The plaintext medical record.
 * @param {string} patientNip - For encryption.
 * @param {string} patientId - UUID of the patient in the backend.
 * @param {string} recordType - e.g. "PRESCRIPTION", "TEST_RESULT", "VACCINE".
 * @param {string} documentHash - SHA-256 hash of the original document (for integrity).
 * @param {string} pinataApiKey
 * @param {string} pinataSecretKey
 * @param {string} jwtToken - Backend auth token.
 * @returns {Promise<{cid: string, record: object}>}
 */
async function createRecord({
    recordData, patientNip, patientId,
    recordType, documentHash,
    pinataApiKey, pinataSecretKey, jwtToken,
    apiBase = 'http://localhost:3000'
}) {
    // 1. Upload encrypted record to IPFS
    const cid = await uploadRecord(recordData, patientNip, pinataApiKey, pinataSecretKey, {
        name: `${recordType.toLowerCase()}-${patientId}`,
    });

    // 2. Save the CID to the backend DB
    const record = await saveRecordToBackend({
        patient_id: patientId,
        record_type: recordType,
        ipfs_cid: cid,
        document_hash: documentHash,
    }, jwtToken, apiBase);

    return { cid, record };
}

// Expose as global so non-module scripts can call window.NutriIPFS.*
window.NutriIPFS = { uploadRecord, fetchRecord, saveRecordToBackend, createRecord };
