import { getDataMode } from './dataConfig';

// Graylog configuration
const GRAYLOG_CONFIG = {
  development: {
    host: 'localhost',
    port: 12201,
    protocol: 'http',
    webInterface: 'http://localhost:9000',
  },
  production: {
    // Configure for your production Graylog instance
    host: 'your-production-graylog-host',
    port: 12201,
    protocol: 'https',
    webInterface: 'https://your-production-graylog-host:9000',
  },
};

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  message: string;
  level: LogLevel;
  timestamp: string;
  source: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  platform?: 'web' | 'android' | 'ios';
  environment?: 'development' | 'production';
}

class GraylogService {
  private config: typeof GRAYLOG_CONFIG.development;
  private isEnabled: boolean = false;
  private sessionId: string;
  private platform: 'web' | 'android' | 'ios';

  constructor() {
    const dataMode = getDataMode();
    this.config = GRAYLOG_CONFIG[dataMode as keyof typeof GRAYLOG_CONFIG];
    this.isEnabled = dataMode === 'development'; // Enable for development initially
    this.sessionId = this.generateSessionId();
    this.platform = this.detectPlatform();
    
    console.log(`[GraylogService] Initialized in ${dataMode} mode, enabled: ${this.isEnabled}`);
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectPlatform(): 'web' | 'android' | 'ios' {
    if (typeof window !== 'undefined') {
      return 'web';
    }
    // For React Native, you might need to import Platform from 'react-native'
    // For now, we'll default to 'android' for simplicity
    return 'android';
  }

  private async sendToGraylog(logEntry: LogEntry): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    try {
      const gelfMessage = {
        version: '1.1',
        host: this.platform,
        short_message: logEntry.message,
        full_message: logEntry.message,
        timestamp: new Date(logEntry.timestamp).getTime() / 1000,
        level: this.mapLogLevel(logEntry.level),
        facility: 'hmi-app',
        _source: logEntry.source,
        _component: logEntry.component || 'unknown',
        _session_id: this.sessionId,
        _platform: logEntry.platform || this.platform,
        _environment: logEntry.environment || getDataMode(),
        _user_id: logEntry.userId || 'anonymous',
        ...Object.fromEntries(
          Object.entries(logEntry.metadata || {}).map(([key, value]) => [
            `_${key}`,
            typeof value === 'object' ? JSON.stringify(value) : value,
          ])
        ),
      };

      // For development, use HTTP POST to Graylog's GELF HTTP input
      const response = await fetch(
        `${this.config.protocol}://${this.config.host}:${this.config.port}/gelf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(gelfMessage),
        }
      );

      if (!response.ok) {
        console.warn(`[GraylogService] Failed to send log to Graylog: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[GraylogService] Error sending log to Graylog:', error);
    }
  }

  private mapLogLevel(level: LogLevel): number {
    const levelMap = {
      debug: 7,
      info: 6,
      warn: 4,
      error: 3,
    };
    return levelMap[level] || 6;
  }

  // Enhanced logging methods
  async debug(message: string, component?: string, metadata?: Record<string, any>): Promise<void> {
    const logEntry: LogEntry = {
      message,
      level: 'debug',
      timestamp: new Date().toISOString(),
      source: 'hmi-frontend',
      component,
      sessionId: this.sessionId,
      platform: this.platform,
      environment: getDataMode() as 'development' | 'production',
      metadata,
    };

    // Always log to console for development
    console.debug(`[${component || 'DEBUG'}]`, message, metadata || '');
    
    await this.sendToGraylog(logEntry);
  }

  async info(message: string, component?: string, metadata?: Record<string, any>): Promise<void> {
    const logEntry: LogEntry = {
      message,
      level: 'info',
      timestamp: new Date().toISOString(),
      source: 'hmi-frontend',
      component,
      sessionId: this.sessionId,
      platform: this.platform,
      environment: getDataMode() as 'development' | 'production',
      metadata,
    };

    console.info(`[${component || 'INFO'}]`, message, metadata || '');
    
    await this.sendToGraylog(logEntry);
  }

  async warn(message: string, component?: string, metadata?: Record<string, any>): Promise<void> {
    const logEntry: LogEntry = {
      message,
      level: 'warn',
      timestamp: new Date().toISOString(),
      source: 'hmi-frontend',
      component,
      sessionId: this.sessionId,
      platform: this.platform,
      environment: getDataMode() as 'development' | 'production',
      metadata,
    };

    console.warn(`[${component || 'WARN'}]`, message, metadata || '');
    
    await this.sendToGraylog(logEntry);
  }

  async error(message: string, component?: string, error?: Error, metadata?: Record<string, any>): Promise<void> {
    const logEntry: LogEntry = {
      message,
      level: 'error',
      timestamp: new Date().toISOString(),
      source: 'hmi-frontend',
      component,
      sessionId: this.sessionId,
      platform: this.platform,
      environment: getDataMode() as 'development' | 'production',
      metadata: {
        ...metadata,
        error_message: error?.message,
        error_stack: error?.stack,
        error_name: error?.name,
      },
    };

    console.error(`[${component || 'ERROR'}]`, message, error || '', metadata || '');
    
    await this.sendToGraylog(logEntry);
  }

  // Method to log API calls
  async logApiCall(
    method: string,
    url: string,
    statusCode?: number,
    duration?: number,
    error?: Error,
    metadata?: Record<string, any>
  ): Promise<void> {
    const level: LogLevel = statusCode && statusCode >= 400 ? 'error' : 'info';
    const message = `API ${method.toUpperCase()} ${url} - ${statusCode || 'PENDING'}`;

    if (level === 'error') {
      await this.error(
        message,
        'API',
        error,
        {
          ...metadata,
          api_method: method,
          api_url: url,
          api_status_code: statusCode,
          api_duration_ms: duration,
        }
      );
    } else {
      await this.info(
        message,
        'API',
        {
          ...metadata,
          api_method: method,
          api_url: url,
          api_status_code: statusCode,
          api_duration_ms: duration,
        }
      );
    }
  }

  // Method to log user actions
  async logUserAction(
    action: string,
    component: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.info(
      `User action: ${action}`,
      component,
      {
        ...metadata,
        user_action: action,
        user_id: userId,
      }
    );
  }

  // Enable/disable logging
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`[GraylogService] Logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Get current configuration
  getConfig(): typeof GRAYLOG_CONFIG.development & { enabled: boolean; sessionId: string } {
    return {
      ...this.config,
      enabled: this.isEnabled,
      sessionId: this.sessionId,
    };
  }
}

// Create singleton instance
export const graylogService = new GraylogService();

// Convenience methods for quick logging
export const logDebug = (message: string, component?: string, metadata?: Record<string, any>) =>
  graylogService.debug(message, component, metadata);

export const logInfo = (message: string, component?: string, metadata?: Record<string, any>) =>
  graylogService.info(message, component, metadata);

export const logWarn = (message: string, component?: string, metadata?: Record<string, any>) =>
  graylogService.warn(message, component, metadata);

export const logError = (message: string, component?: string, error?: Error, metadata?: Record<string, any>) =>
  graylogService.error(message, component, error, metadata);

export const logApiCall = (
  method: string,
  url: string,
  statusCode?: number,
  duration?: number,
  error?: Error,
  metadata?: Record<string, any>
) => graylogService.logApiCall(method, url, statusCode, duration, error, metadata);

export const logUserAction = (
  action: string,
  component: string,
  userId?: string,
  metadata?: Record<string, any>
) => graylogService.logUserAction(action, component, userId, metadata);

export default graylogService;
