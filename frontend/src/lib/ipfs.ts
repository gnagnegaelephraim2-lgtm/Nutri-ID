// Port of ipfs.js — AES-256-GCM encryption + Pinata IPFS upload

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
export const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export interface EncryptedBlob {
  ciphertext: string;
  iv: string;
  salt: string;
  algorithm: 'AES-256-GCM';
  version: '1.0';
}

export interface CreateRecordOptions {
  recordData: object;
  patientNip: string;
  patientId: string;
  recordType: string;
  documentHash: string;
  pinataApiKey: string;
  pinataSecretKey: string;
  jwtToken: string;
}

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptRecord(data: object, patientNip: string): Promise<EncryptedBlob> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>;
  const iv = window.crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>;
  const key = await deriveKey(patientNip, salt);
  const plaintext = enc.encode(JSON.stringify(data));
  const cipherBuffer = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(cipherBuffer))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
    algorithm: 'AES-256-GCM',
    version: '1.0',
  };
}

export async function uploadRecord(
  recordData: object,
  patientNip: string,
  pinataApiKey: string,
  pinataSecretKey: string,
  metadata: { name?: string; keyvalues?: Record<string, string> } = {}
): Promise<string> {
  if (!patientNip) throw new Error('Patient NIP is required for encryption.');
  if (!pinataApiKey || !pinataSecretKey) throw new Error('Pinata API credentials are required.');

  const encrypted = await encryptRecord(recordData, patientNip);
  const payload = {
    pinataMetadata: {
      name: metadata.name || `nutriid-record-${Date.now()}`,
      keyvalues: { system: 'nutri-id', country: 'CI', ...metadata.keyvalues },
    },
    pinataContent: {
      _encrypted: true,
      _system: 'Nutri-ID v1.0 — Ministère de la Santé CI',
      ...encrypted,
    },
  };

  const response = await fetch(PINATA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'pinata_api_key': pinataApiKey,
      'pinata_secret_api_key': pinataSecretKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Pinata upload failed (${response.status}): ${errText}`);
  }

  const result = await response.json() as { IpfsHash: string };
  return result.IpfsHash;
}

export async function saveRecordToBackend(
  recordPayload: { record_type: string; ipfs_cid: string; document_hash: string; patient_id?: string },
  jwtToken: string
): Promise<object> {
  const response = await fetch('/api/records', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`,
    },
    body: JSON.stringify(recordPayload),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Backend record save failed (${response.status}): ${err}`);
  }
  return response.json();
}

export async function createRecord(opts: CreateRecordOptions): Promise<{ cid: string; record: object }> {
  const cid = await uploadRecord(opts.recordData, opts.patientNip, opts.pinataApiKey, opts.pinataSecretKey, {
    name: `${opts.recordType.toLowerCase()}-${opts.patientId}`,
  });
  const record = await saveRecordToBackend(
    { patient_id: opts.patientId, record_type: opts.recordType, ipfs_cid: cid, document_hash: opts.documentHash },
    opts.jwtToken
  );
  return { cid, record };
}
