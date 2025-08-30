/**
 * Security headers configuration for Cloudflare Workers
 * Implements CORS, CSP, and other security headers
 */

export interface SecurityHeadersConfig {
  corsOrigins?: string[];
  cspDirectives?: Record<string, string>;
  isDevelopment?: boolean;
}

/**
 * Default security headers for production
 */
export function getDefaultSecurityHeaders(config: SecurityHeadersConfig = {}): Record<string, string> {
  const { corsOrigins = [], cspDirectives = {}, isDevelopment = false } = config;
  
  // Content Security Policy
  const defaultCSP = {
    'default-src': "'self'",
    'script-src': isDevelopment 
      ? "'self' 'unsafe-inline' 'unsafe-eval'" 
      : "'self'",
    'style-src': "'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
    'img-src': "'self' data: https:",
    'font-src': "'self' https:",
    'connect-src': isDevelopment 
      ? "'self' ws: wss:" 
      : "'self'",
    'frame-ancestors': "'none'",
    'base-uri': "'self'",
    'object-src': "'none'"
  };
  
  const csp = { ...defaultCSP, ...cspDirectives };
  const cspString = Object.entries(csp)
    .map(([directive, value]) => `${directive} ${value}`)
    .join('; ');
  
  const headers: Record<string, string> = {
    // Content Security Policy
    'Content-Security-Policy': cspString,
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy (formerly Feature Policy)
    'Permissions-Policy': [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'speaker=()'
    ].join(', ')
  };
  
  // Add HSTS for HTTPS (Cloudflare handles this automatically for custom domains)
  if (!isDevelopment) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }
  
  return headers;
}

/**
 * CORS headers for API endpoints
 */
export function getCorsHeaders(config: SecurityHeadersConfig = {}): Record<string, string> {
  const { corsOrigins = [], isDevelopment = false } = config;
  
  // Allow all origins in development, specific origins in production
  const allowedOrigins = isDevelopment 
    ? ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000']
    : corsOrigins;
  
  return {
    'Access-Control-Allow-Origin': allowedOrigins.length === 1 
      ? allowedOrigins[0] 
      : '*', // Will be overridden by handleCORS function
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400' // 24 hours
  };
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsRequest(request: Request, config: SecurityHeadersConfig = {}): Response | null {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const corsHeaders = getCorsHeaders(config);
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  return null;
}

/**
 * Add security headers to a response
 */
export function addSecurityHeaders(response: Response, config: SecurityHeadersConfig = {}): Response {
  const securityHeaders = getDefaultSecurityHeaders(config);
  const corsHeaders = getCorsHeaders(config);
  
  // Clone the response to add headers
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  
  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  
  return newResponse;
}

/**
 * Validate origin for CORS
 */
export function isAllowedOrigin(origin: string, config: SecurityHeadersConfig = {}): boolean {
  const { corsOrigins = [], isDevelopment = false } = config;
  
  if (isDevelopment) {
    const devOrigins = [
      'http://localhost:3000',
      'http://localhost:5173', 
      'http://127.0.0.1:3000',
      'http://localhost:8787' // Wrangler dev server
    ];
    return devOrigins.includes(origin);
  }
  
  return corsOrigins.includes(origin);
}

/**
 * Security middleware for Cloudflare Workers
 */
export function securityMiddleware(config: SecurityHeadersConfig = {}) {
  return (request: Request, response: Response): Response => {
    // Handle CORS preflight
    const corsResponse = handleCorsRequest(request, config);
    if (corsResponse) return corsResponse;
    
    // Validate origin
    const origin = request.headers.get('Origin');
    if (origin && !isAllowedOrigin(origin, config)) {
      return new Response('Forbidden', { status: 403 });
    }
    
    // Add security headers
    return addSecurityHeaders(response, config);
  };
}

/**
 * Rate limiting configuration for Cloudflare
 * Note: This would typically be configured at the Cloudflare dashboard level
 */
export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  skipOnError?: boolean;
}

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  requestsPerMinute: 60,
  requestsPerHour: 1000,
  requestsPerDay: 10000,
  skipOnError: true
};