/**
 * Bot protection middleware for Cloudflare Workers
 * Blocks common bot probes and malicious crawlers
 */

// Common malicious bot patterns and paths
const BLOCKED_PATHS = [
  // WordPress probes
  "/wp-admin",
  "/wp-login",
  "/wp-content",
  "/wp-includes",
  "/wp-config",
  "/wp-json",
  "/wordpress",
  "/old/wp-admin",
  "/blog/wp-admin",
  "/site/wp-admin",
  "/test/wp-admin",
  "/demo/wp-admin",

  // Admin panel probes
  "/admin",
  "/administrator",
  "/phpmyadmin",
  "/phpMyAdmin",
  "/pma",
  "/mysql",
  "/adminer",
  "/cpanel",
  "/panel",
  "/dashboard",
  "/manager",

  // Common CMS probes
  "/drupal",
  "/joomla",
  "/magento",
  "/prestashop",
  "/opencart",
  "/typo3",

  // Server probes
  "/.env",
  "/.git",
  "/config",
  "/backup",
  "/backups",
  "/db",
  "/database",
  "/sql",
  "/dump",
  "/data",
  "/logs",
  "/log",
  "/temp",
  "/tmp",
  "/cache",

  // Security probes
  "/shell",
  "/cmd",
  "/eval",
  "/upload",
  "/uploads",
  "/files",
  "/filemanager",
  "/cgi-bin",
  "/scripts",
  "/api/v1/auth",
  "/xmlrpc",

  // Note: Removed "/robots.txt", "/sitemap.xml", "/.well-known", "/favicon.ico"
  // as these are handled specifically and should be allowed
];

// Suspicious file extensions
const BLOCKED_EXTENSIONS = [
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
  ".cgi",
  ".pl",
  ".py",
  ".rb",
  ".sh",
  ".bat",
  ".cmd",
  ".exe",
  ".sql",
  ".bak",
  ".backup",
  ".log",
  ".ini",
  ".conf",
  ".config",
];

// Known bad user agents (partial matches)
const BLOCKED_USER_AGENTS = [
  "sqlmap",
  "nmap",
  "nikto",
  "whatweb",
  "dirb",
  "dirbuster",
  "gobuster",
  "wfuzz",
  "burp",
  "acunetix",
  "nessus",
  "openvas",
  "masscan",
  "zmap",
  "zgrab",
  "shodan",
  "censys",
  "scanner",
  "badbot",
  "malbot",
  "hackbot",
  "python-requests/2.6", // Very old version often used maliciously
  "libwww-perl",
  // Note: Removed generic "bot", "crawl", "spider", "scraper", "curl", "wget"
  // as these can be legitimate
];

// Rate limiting for suspicious IPs (adjusted for normal human interaction)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // Allow 120 requests per minute (2 per second) for normal usage

export interface BotProtectionConfig {
  enabled: boolean;
  logBlocked: boolean;
  rateLimitEnabled: boolean;
  customBlockedPaths?: string[];
  customBlockedUserAgents?: string[];
  whitelist?: string[];
}

export function createBotProtectionMiddleware(config: BotProtectionConfig) {
  return async (request: Request, env: any): Promise<Response | null> => {
    if (!config.enabled) {
      return null; // Pass through if disabled
    }

    const url = new URL(request.url);
    const userAgent = request.headers.get("user-agent")?.toLowerCase() || "";
    const clientIP =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      "unknown";

    // Check whitelist first
    if (config.whitelist && isWhitelisted(clientIP, config.whitelist)) {
      return null;
    }

    // Check for blocked paths
    const blockedPaths = [
      ...BLOCKED_PATHS,
      ...(config.customBlockedPaths || []),
    ];
    if (isBlockedPath(url.pathname, blockedPaths)) {
      if (config.logBlocked) {
        console.log(
          `Blocked bot probe: ${url.pathname} from ${clientIP} UA: ${userAgent}`
        );
      }
      return createBlockedResponse("Path not allowed");
    }

    // Check for blocked file extensions
    if (hasBlockedExtension(url.pathname)) {
      if (config.logBlocked) {
        console.log(`Blocked file extension: ${url.pathname} from ${clientIP}`);
      }
      return createBlockedResponse("File type not allowed");
    }

    // Check for blocked user agents
    const blockedUserAgents = [
      ...BLOCKED_USER_AGENTS,
      ...(config.customBlockedUserAgents || []),
    ];
    if (isBlockedUserAgent(userAgent, blockedUserAgents)) {
      if (config.logBlocked) {
        console.log(`Blocked user agent: ${userAgent} from ${clientIP}`);
      }
      return createBlockedResponse("User agent not allowed");
    }

    // Rate limiting
    if (config.rateLimitEnabled && env.RATE_LIMIT_KV) {
      const rateLimitResult = await checkRateLimit(clientIP, env.RATE_LIMIT_KV);
      if (rateLimitResult.blocked) {
        if (config.logBlocked) {
          console.log(
            `Rate limited: ${clientIP} (${rateLimitResult.count} requests)`
          );
        }
        return createBlockedResponse("Rate limit exceeded", 429);
      }
    }

    // Suspicious query parameters
    if (hasSuspiciousParams(url.searchParams)) {
      if (config.logBlocked) {
        console.log(
          `Blocked suspicious params: ${url.pathname}${url.search} from ${clientIP}`
        );
      }
      return createBlockedResponse("Suspicious request");
    }

    return null; // Allow request to proceed
  };
}

function isWhitelisted(ip: string, whitelist: string[]): boolean {
  return whitelist.some(
    whitelistedIP => ip === whitelistedIP || ip.startsWith(whitelistedIP)
  );
}

function isBlockedPath(pathname: string, blockedPaths: string[]): boolean {
  const normalizedPath = pathname.toLowerCase();
  return blockedPaths.some(blockedPath => {
    const normalizedBlockedPath = blockedPath.toLowerCase();
    // Only match if path starts with blocked path and is followed by / or end of string
    // This prevents "/admin" from blocking "/administration" (legitimate app route)
    return (
      normalizedPath === normalizedBlockedPath ||
      normalizedPath.startsWith(normalizedBlockedPath + "/") ||
      normalizedPath.startsWith(normalizedBlockedPath + ".")
    );
  });
}

function hasBlockedExtension(pathname: string): boolean {
  const extension = pathname.toLowerCase().split(".").pop();
  return extension ? BLOCKED_EXTENSIONS.includes(`.${extension}`) : false;
}

function isBlockedUserAgent(
  userAgent: string,
  blockedUserAgents: string[]
): boolean {
  return blockedUserAgents.some(blocked =>
    userAgent.includes(blocked.toLowerCase())
  );
}

function hasSuspiciousParams(params: URLSearchParams): boolean {
  const suspiciousParams = [
    "union",
    "select",
    "drop",
    "insert",
    "update",
    "delete",
    "script",
    "javascript",
    "vbscript",
    "onload",
    "onerror",
    "../",
    "..\\",
    "/etc/passwd",
    "/proc/",
    "cmd=",
    "exec=",
    "eval(",
    "system(",
    "shell_exec",
    "base64_decode",
  ];

  for (const [key, value] of params.entries()) {
    const combined = `${key}=${value}`.toLowerCase();
    if (suspiciousParams.some(suspicious => combined.includes(suspicious))) {
      return true;
    }
  }
  return false;
}

async function checkRateLimit(
  ip: string,
  kv: KVNamespace
): Promise<{ blocked: boolean; count: number }> {
  const key = `rate_limit:${ip}`;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  try {
    // Get current count
    const stored = await kv.get(key);
    const data: { requests: number[]; lastPutTime?: number } = stored
      ? JSON.parse(stored)
      : { requests: [] };

    // Remove old requests outside the window
    data.requests = data.requests.filter(timestamp => timestamp > windowStart);

    // Add current request
    data.requests.push(now);

    // Only update KV every 30 seconds or when approaching limit to reduce PUT operations
    const timeSinceLastPut = now - (data.lastPutTime || 0);
    const approachingLimit =
      data.requests.length > MAX_REQUESTS_PER_WINDOW * 0.8; // 80% of limit
    const needsPut =
      timeSinceLastPut > 30000 || approachingLimit || !data.lastPutTime;

    if (needsPut) {
      data.lastPutTime = now;
      await kv.put(key, JSON.stringify(data), {
        expirationTtl: Math.ceil(RATE_LIMIT_WINDOW / 1000) + 10, // Extra buffer
      });
    }

    return {
      blocked: data.requests.length > MAX_REQUESTS_PER_WINDOW,
      count: data.requests.length,
    };
  } catch (error) {
    // If KV fails, don't block (fail open)
    console.error("Rate limit check failed:", error);
    return { blocked: false, count: 0 };
  }
}

function createBlockedResponse(reason: string, status: number = 403): Response {
  return new Response(
    JSON.stringify({
      error: "Forbidden",
      message: reason,
      status: status,
    }),
    {
      status: status,
      headers: {
        "Content-Type": "application/json",
        "X-Blocked-By": "kimmy-app-bot-protection",
        "Cache-Control": "no-store",
      },
    }
  );
}

// Specific handler for robots.txt to avoid unnecessary blocks
export function handleRobotsTxt(): Response {
  const robotsTxt = `User-agent: *
Disallow: /admin
Disallow: /api
Disallow: /manage
Disallow: /onboarding
Disallow: /settings
Disallow: /member/
Disallow: /household-records
Disallow: /insights
Disallow: /analytics
Allow: /

Sitemap: https://kimmy-app.palindrome.workers.dev/sitemap.xml`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
