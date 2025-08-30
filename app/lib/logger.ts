/**
 * Production-safe logging utility for Cloudflare Workers
 * Only logs in development/local environment
 */

export interface LogContext {
  userId?: number;
  householdId?: string;
  requestId?: string;
  action?: string;
  [key: string]: any;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment: boolean;
  private requestId: string;

  constructor() {
    // Check if we're in development environment
    this.isDevelopment = this.checkIsDevelopment();
    this.requestId = this.generateRequestId();
  }

  private checkIsDevelopment(): boolean {
    // In Cloudflare Workers, we can check for development indicators
    // Note: NODE_ENV might not be available in Workers, so we use multiple checks
    try {
      // Check for common development indicators
      const isNodeDev = import.meta.env?.DEV === true;
      const isLocalhost = typeof location !== 'undefined' && location.hostname === 'localhost';
      const isDevDomain = typeof location !== 'undefined' && location.hostname.includes('.dev');
      
      return isNodeDev || isLocalhost || isDevDomain;
    } catch {
      // If any error occurs, assume production for safety
      return false;
    }
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.requestId}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.error(this.formatMessage('error', message, context));
    }
  }

  // Secure logging methods that never log sensitive data
  authAttempt(email: string, success: boolean, context?: Omit<LogContext, 'email'>): void {
    this.info(`Authentication attempt: ${success ? 'SUCCESS' : 'FAILED'}`, {
      email: this.maskEmail(email),
      success,
      ...context
    });
  }

  dbOperation(operation: string, table: string, success: boolean, context?: LogContext): void {
    this.debug(`DB ${operation} on ${table}: ${success ? 'SUCCESS' : 'FAILED'}`, {
      operation,
      table,
      success,
      ...context
    });
  }

  apiRequest(method: string, path: string, statusCode: number, context?: LogContext): void {
    this.info(`${method} ${path} -> ${statusCode}`, {
      method,
      path,
      statusCode,
      ...context
    });
  }

  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void {
    this.error(`SECURITY EVENT: ${event} (${severity.toUpperCase()})`, {
      event,
      severity,
      timestamp: Date.now(),
      ...context
    });
  }

  // Helper methods
  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return 'invalid-email';
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 ? local.charAt(0) + '***' + local.charAt(local.length - 1) : '***';
    return `${maskedLocal}@${domain}`;
  }

  // Context management
  withContext(baseContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) => 
        this.debug(message, { ...baseContext, ...context }),
      info: (message: string, context?: LogContext) => 
        this.info(message, { ...baseContext, ...context }),
      warn: (message: string, context?: LogContext) => 
        this.warn(message, { ...baseContext, ...context }),
      error: (message: string, context?: LogContext) => 
        this.error(message, { ...baseContext, ...context }),
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing or custom instances
export { Logger };

// Convenience exports for common patterns
export const authLogger = logger.withContext({ component: 'auth' });
export const dbLogger = logger.withContext({ component: 'database' });
export const apiLogger = logger.withContext({ component: 'api' });
export const analyticsLogger = logger.withContext({ component: 'analytics' });