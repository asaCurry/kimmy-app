/**
 * Secure session management for Cloudflare Workers
 * Implements JWT-based sessions with proper security flags
 */

import { logger } from "./logger";

export interface SecureSessionData {
  userId: number;
  email: string;
  name: string;
  currentHouseholdId?: string;
  role: "admin" | "member";
  iat: number; // issued at
  exp: number; // expires at
}

export interface SessionConfig {
  secret: string;
  maxAge?: number; // in seconds, default 24 hours
  secure?: boolean; // auto-detect in production
  sameSite?: 'Strict' | 'Lax' | 'None';
  httpOnly?: boolean;
}

/**
 * Create a signed JWT-like token using Web Crypto API
 * Compatible with Cloudflare Workers Edge Runtime
 */
export async function createSecureToken(data: Omit<SecureSessionData, 'iat' | 'exp'>, config: SessionConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SecureSessionData = {
    ...data,
    iat: now,
    exp: now + (config.maxAge || 24 * 60 * 60) // 24 hours default
  };

  // Create the token parts
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerBase64 = btoa(JSON.stringify(header)).replace(/[+/]/g, char => char === '+' ? '-' : '_').replace(/=/g, '');
  const payloadBase64 = btoa(JSON.stringify(payload)).replace(/[+/]/g, char => char === '+' ? '-' : '_').replace(/=/g, '');
  
  // Sign with HMAC-SHA256
  const signatureInput = `${headerBase64}.${payloadBase64}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(config.secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signatureInput));
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/[+/]/g, char => char === '+' ? '-' : '_')
    .replace(/=/g, '');

  return `${headerBase64}.${payloadBase64}.${signatureBase64}`;
}

/**
 * Verify and decode a secure token
 */
export async function verifySecureToken(token: string, secret: string): Promise<SecureSessionData | null> {
  try {
    const [headerBase64, payloadBase64, signatureBase64] = token.split('.');
    if (!headerBase64 || !payloadBase64 || !signatureBase64) {
      logger.securityEvent('Invalid token format', 'medium', { tokenParts: token.split('.').length });
      return null;
    }

    // Verify signature
    const signatureInput = `${headerBase64}.${payloadBase64}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = new Uint8Array(
      atob(signatureBase64.replace(/[-_]/g, char => char === '-' ? '+' : '/'))
        .split('')
        .map(char => char.charCodeAt(0))
    );
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(signatureInput)
    );
    
    if (!isValid) {
      logger.securityEvent('Token signature verification failed', 'high');
      return null;
    }

    // Decode payload
    const payloadJson = atob(payloadBase64.replace(/[-_]/g, char => char === '-' ? '+' : '/'));
    const payload: SecureSessionData = JSON.parse(payloadJson);
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      logger.info('Token expired', { exp: payload.exp, now, userId: payload.userId });
      return null;
    }
    
    return payload;
  } catch (error) {
    logger.securityEvent('Token verification error', 'medium', { error: error instanceof Error ? error.message : 'Unknown' });
    return null;
  }
}

/**
 * Create secure session cookie string for server-side setting
 */
export function createSessionCookie(token: string, config: SessionConfig): string {
  const maxAge = config.maxAge || 24 * 60 * 60;
  const secure = config.secure ?? true; // Default to secure in production
  const sameSite = config.sameSite || 'Strict';
  const httpOnly = config.httpOnly ?? true;
  
  const cookieParts = [
    `kimmy_session=${token}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    secure ? 'Secure' : '',
    `SameSite=${sameSite}`,
    httpOnly ? 'HttpOnly' : ''
  ].filter(Boolean);
  
  return cookieParts.join('; ');
}

/**
 * Parse session cookie from request headers
 */
export function parseSessionCookie(cookieHeader: string): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);
  
  return cookies['kimmy_session'] || null;
}

/**
 * Create session clear cookie (for logout)
 */
export function createClearSessionCookie(): string {
  return 'kimmy_session=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict';
}

/**
 * Middleware to extract and validate session from request
 */
export async function extractSecureSession(request: Request, secret: string): Promise<SecureSessionData | null> {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) {
    logger.debug('No cookie header found in request');
    return null;
  }
  
  const token = parseSessionCookie(cookieHeader);
  if (!token) {
    logger.debug('No session token found in cookies');
    return null;
  }
  
  const session = await verifySecureToken(token, secret);
  if (session) {
    logger.debug('Session validated successfully', { 
      userId: session.userId, 
      householdId: session.currentHouseholdId 
    });
  }
  
  return session;
}