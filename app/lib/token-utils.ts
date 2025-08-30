/**
 * Secure token generation utilities
 * Uses cryptographically secure random bytes for session tokens
 */

/**
 * Generate a cryptographically secure random token
 * @param length - Length of the token in bytes (default: 32)
 * @returns Base64-encoded secure random token
 */
export function generateSecureToken(length: number = 32): string {
  // For Node.js/Edge runtime environments
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buffer = new Uint8Array(length);
    crypto.getRandomValues(buffer);
    return btoa(String.fromCharCode(...buffer))
      .replace(/[+/=]/g, (char) => ({ '+': '-', '/': '_', '=': '' })[char] || char);
  }
  
  // Fallback for environments without crypto.getRandomValues
  // This should not happen in modern environments
  console.warn('crypto.getRandomValues not available, using fallback method');
  let result = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a session token with proper prefix for identification
 * @returns Secure session token with 'sess_' prefix
 */
export function generateSessionToken(): string {
  const randomPart = generateSecureToken(32);
  const timestamp = Date.now().toString(36); // For debugging/ordering only, not security
  return `sess_${timestamp}_${randomPart}`;
}

/**
 * Generate an invite code (shorter, user-friendly)
 * @returns 8-character uppercase alphanumeric code
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buffer = new Uint8Array(8);
    crypto.getRandomValues(buffer);
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(buffer[i] % chars.length);
    }
  } else {
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  
  return result;
}