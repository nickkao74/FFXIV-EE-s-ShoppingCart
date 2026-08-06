import type { SessionPayload } from './types';

const SESSION_COOKIE = '__Host-ffxiv_session';
const OAUTH_STATE_COOKIE = '__Host-ffxiv_oauth_state';
const SESSION_MAX_AGE = 86400;
const STATE_MAX_AGE = 600;

function base64UrlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function hmacSha256(secret: string, value: string): Promise<Uint8Array> {
  const key = await importHmacKey(secret);
  const buffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return new Uint8Array(buffer);
}

function constantTimeCompare(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  let result = 0;
  for (let i = 0; i < a.byteLength; i++) result |= a[i] ^ b[i];
  return result === 0;
}

export async function signSessionToken(payload: SessionPayload, secret: string): Promise<string> {
  const data = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await hmacSha256(secret, data);
  return `${data}.${base64UrlEncode(signature)}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<SessionPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [dataPart, signaturePart] = parts;
  let expected: Uint8Array;
  try {
    expected = await hmacSha256(secret, dataPart);
  } catch {
    return null;
  }

  let signature: Uint8Array;
  try {
    signature = base64UrlDecode(signaturePart);
  } catch {
    return null;
  }

  if (!constantTimeCompare(expected, signature)) return null;

  try {
    const decoded = new TextDecoder().decode(base64UrlDecode(dataPart));
    const payload = JSON.parse(decoded) as SessionPayload;
    if (typeof payload !== 'object' || payload === null) return null;
    if (typeof payload.userId !== 'string') return null;
    if (typeof payload.displayName !== 'string') return null;
    if (payload.avatar !== null && typeof payload.avatar !== 'string') return null;
    if (payload.role !== 'member' && payload.role !== 'admin') return null;
    if (typeof payload.expiresAt !== 'number') return null;
    if (Date.now() > payload.expiresAt) return null;
    return payload;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx < 0) return;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name) cookies[name] = value;
  });
  return cookies;
}

export function makeSessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;
}

export function makeExpiredSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function makeOAuthStateCookie(state: string): string {
  return `${OAUTH_STATE_COOKIE}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${STATE_MAX_AGE}`;
}

export function makeExpiredOAuthStateCookie(): string {
  return `${OAUTH_STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function createOAuthState(): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export function getSessionRole(userId: string, memberRoles: string[], adminRoleId: string, adminUserId: string): 'admin' | 'member' {
  return userId === adminUserId || memberRoles.indexOf(adminRoleId) >= 0 ? 'admin' : 'member';
}

export function isAdmin(session: SessionPayload): boolean {
  return session.role === 'admin';
}
