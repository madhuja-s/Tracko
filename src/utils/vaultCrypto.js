// All locking and unlocking happens here, in your browser.
// Uses the standard Web Crypto tools (AES-256-GCM and PBKDF2).

const enc = new TextEncoder()
const dec = new TextDecoder()

export const KDF_ITERATIONS = 600000

// no I, O, 0 or 1, so the key is easy to read and type
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const rand = (n) => crypto.getRandomValues(new Uint8Array(n))

function toB64(buf) {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin)
}

function fromB64(str) {
  const bin = atob(str)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

const cleanPassword = (p) => p.normalize('NFKC')
export const cleanRecoveryKey = (k) => k.toUpperCase().replace(/[^A-Z0-9]/g, '')

// 24 characters x 5 bits = 120 bits of randomness
export function generateRecoveryKey() {
  const bytes = rand(24)
  const chars = Array.from(bytes, (b) => RECOVERY_ALPHABET[b % 32])
  return chars.join('').match(/.{4}/g).join('-')
}

async function deriveKek(secret, salt, iterations) {
  const base = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  )
}

async function wrapDek(dek, kek) {
  const iv = rand(12)
  const data = await crypto.subtle.wrapKey('raw', dek, kek, { name: 'AES-GCM', iv })
  return { iv: toB64(iv), data: toB64(data) }
}

function unwrapDek(wrapped, kek, extractable) {
  return crypto.subtle.unwrapKey(
    'raw',
    fromB64(wrapped.data),
    kek,
    { name: 'AES-GCM', iv: fromB64(wrapped.iv) },
    { name: 'AES-GCM', length: 256 },
    extractable,
    ['encrypt', 'decrypt'],
  )
}

// makes a brand new vault: one random master key, locked twice
// (once by your password, once by the recovery key)
export async function createVaultMeta(password) {
  const dek = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ])
  const recoveryKey = generateRecoveryKey()
  const saltP = rand(16)
  const saltR = rand(16)

  const [kekP, kekR] = await Promise.all([
    deriveKek(cleanPassword(password), saltP, KDF_ITERATIONS),
    deriveKek(cleanRecoveryKey(recoveryKey), saltR, KDF_ITERATIONS),
  ])

  const meta = {
    v: 1,
    iter: KDF_ITERATIONS,
    saltP: toB64(saltP),
    saltR: toB64(saltR),
    wrapP: await wrapDek(dek, kekP),
    wrapR: await wrapDek(dek, kekR),
  }
  return { meta, recoveryKey }
}

// these throw an error when the password or key is wrong
export async function openWithPassword(meta, password, extractable = false) {
  const kek = await deriveKek(cleanPassword(password), fromB64(meta.saltP), meta.iter)
  return unwrapDek(meta.wrapP, kek, extractable)
}

export async function openWithRecovery(meta, recoveryKey, extractable = false) {
  const kek = await deriveKek(cleanRecoveryKey(recoveryKey), fromB64(meta.saltR), meta.iter)
  return unwrapDek(meta.wrapR, kek, extractable)
}

// locks the master key again with a new password
export async function makePasswordWrap(dek, newPassword, iterations) {
  const salt = rand(16)
  const kek = await deriveKek(cleanPassword(newPassword), salt, iterations)
  return { saltP: toB64(salt), wrapP: await wrapDek(dek, kek) }
}

// "aad" ties each item to your account so it can't be moved to another one
export async function encryptJson(dek, obj, aad) {
  const iv = rand(12)
  const data = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: enc.encode(aad) },
    dek,
    enc.encode(JSON.stringify(obj)),
  )
  return { iv: toB64(iv), data: toB64(data) }
}

export async function decryptJson(dek, payload, aad) {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(payload.iv), additionalData: enc.encode(aad) },
    dek,
    fromB64(payload.data),
  )
  return JSON.parse(dec.decode(plain))
}