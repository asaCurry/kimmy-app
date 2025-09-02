/**
 * Secure password hashing utilities using Web Crypto API
 * Compatible with Cloudflare Workers and Edge Runtime
 */

/**
 * Generate a random salt using Web Crypto API
 */
async function generateSalt(): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Hash a password using PBKDF2 with Web Crypto API
 * Uses 100,000 iterations for strong security
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await generateSalt();
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import the password as a key
  const key = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  // Derive the hash using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256 // 32 bytes
  );

  // Combine salt and hash
  const hashArray = new Uint8Array(hashBuffer);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);

  // Return as base64 with prefix to identify the format
  return `pbkdf2_${btoa(String.fromCharCode(...combined))}`;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  // Only handle secure PBKDF2 format
  if (!hashedPassword.startsWith("pbkdf2_")) {
    return false;
  }

  try {
    const hashBase64 = hashedPassword.substring(7); // Remove 'pbkdf2_' prefix
    const combined = new Uint8Array(
      atob(hashBase64)
        .split("")
        .map(char => char.charCodeAt(0))
    );

    // Extract salt and hash
    const salt = combined.slice(0, 16);
    const storedHash = combined.slice(16);

    // Hash the input password with the same salt
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const key = await crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      key,
      256
    );

    const computedHash = new Uint8Array(hashBuffer);

    // Compare hashes using constant-time comparison
    return constantTimeEqual(storedHash, computedHash);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

/**
 * Constant-time comparison to prevent timing attacks
 */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}

/**
 * Check if a password appears to be already hashed with secure format
 */
export function isPasswordHashed(password: string): boolean {
  return password.startsWith("pbkdf2_");
}
