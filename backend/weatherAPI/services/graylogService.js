const axios = require('axios');
const dgram = require('dgram');

// Graylog configuration
const GRAYLOG_CONFIG = {
  development: {
    host: 'localhost',
    port: 12201,
    protocol: 'udp', // Use UDP for GELF
    webInterface: 'http://localhost:9000',
  },
  production: {
    // Configure for your production Graylog instance
    host: process.env.GRAYLOG_HOST || 'localhost',
    port: parseInt(process.env.GRAYLOG_PORT) || 12201,
    protocol: process.env.GRAYLOG_PROTOCOL || 'udp',
    webInterface: process.env.GRAYLOG_WEB_INTERFACE || 'http://localhost:9000',
  },
};

class GraylogBackendService {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.config = GRAYLOG_CONFIG[this.environment];
    this.isEnabled = process.env.GRAYLOG_ENABLED !== 'false'; // Enabled by default
    this.sessionId = this.generateSessionId();
    this.serviceName = process.env.SERVICE_NAME || 'hmi-backend';
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async sendToGraylog(logEntry) {
    if (!this.isEnabled) {
      return;
    }

    try {
      const gelfMessage = {
        version: '1.1',
        host: this.serviceName,
        short_message: logEntry.message,
        full_message: logEntry.message,
        timestamp: new Date(logEntry.timestamp).getTime() / 1000,
        level: this.mapLogLevel(logEntry.level),
        facility: 'hmi-backend',
        _source: logEntry.source,
        _component: logEntry.component || 'unknown',
        _session_id: this.sessionId,
        _environment: this.environment,
        _service: this.serviceName,
        ...Object.fromEntries(
          Object.entries(logEntry.metadata || {}).map(([key, value]) => [
            `_${key}`,
            typeof value === 'object' ? JSON.stringify(value) : value,
          ])
        ),
      };

      // Send via UDP GELF
      const client = dgram.createSocket('udp4');
      const messageBuffer = Buffer.from(JSON.stringify(gelfMessage));

      await new Promise((resolve, reject) => {
        client.send(messageBuffer, 0, messageBuffer.length, this.config.port, this.config.host, (error) => {
          client.close();
          if (error) {
            // Keep minimal console.error only for UDP failures to avoid losing critical errors
            console.error('[GraylogService] UDP send failed:', error.message);
            reject(error);
          } else {
            resolve();
          }
        });
      });

    } catch (error) {
      // Don't let logging errors crash the application
      // Use console.error for Graylog service errors to avoid recursion
      console.error('[GraylogService] Error sending log to Graylog:', error.message);
    }
  }

  mapLogLevel(level) {
    const levelMap = {
      debug: 7,
      info: 6,
      warn: 4,
      error: 3,
      fatal: 2,
    };
    return levelMap[level] || 6;
  }

  async debug(message, component = null, metadata = {}) {
    const logEntry = {
      message,
      level: 'debug',
      timestamp: new Date().toISOString(),
      source: 'hmi-backend',
      component,
      metadata,
    };

    await this.sendToGraylog(logEntry);
  }

  async info(message, component = null, metadata = {}) {
    const logEntry = {
      message,
      level: 'info',
      timestamp: new Date().toISOString(),
      source: 'hmi-backend',
      component,
      metadata,
    };

    await this.sendToGraylog(logEntry);
  }

  async warn(message, component = null, metadata = {}) {
    const logEntry = {
      message,
      level: 'warn',
      timestamp: new Date().toISOString(),
      source: 'hmi-backend',
      component,
      metadata,
    };

    await this.sendToGraylog(logEntry);
  }

  async error(message, component = null, error = null, metadata = {}) {
    const logEntry = {
      message,
      level: 'error',
      timestamp: new Date().toISOString(),
      source: 'hmi-backend',
      component,
      metadata: {
        ...metadata,
        error_message: error?.message,
        error_stack: error?.stack,
        error_name: error?.name,
      },
    };

    await this.sendToGraylog(logEntry);
  }

  async logRequest(req, res, duration, metadata = {}) {
    const level = res.statusCode >= 400 ? 'error' : 'info';
    const message = `${req.method} ${req.path} - ${res.statusCode}`;

    const logEntry = {
      message,
      level,
      timestamp: new Date().toISOString(),
      source: 'hmi-backend',
      component: 'HTTP',
      metadata: {
        ...metadata,
        http_method: req.method,
        http_path: req.path,
        http_status_code: res.statusCode,
        http_duration_ms: duration,
        http_user_agent: req.get('User-Agent'),
        http_ip: req.ip || req.connection.remoteAddress,
      },
    };

    await this.sendToGraylog(logEntry);
  }

  async logDatabaseOperation(operation, collection, duration, error = null, metadata = {}) {
    const level = error ? 'error' : 'info';
    const message = `Database ${operation} on ${collection} ${error ? 'failed' : 'completed'}`;

    const logEntry = {
      message,
      level,
      timestamp: new Date().toISOString(),
      source: 'hmi-backend',
      component: 'Database',
      metadata: {
        ...metadata,
        db_operation: operation,
        db_collection: collection,
        db_duration_ms: duration,
        error_message: error?.message,
        error_stack: error?.stack,
      },
    };
    
    await this.sendToGraylog(logEntry);
  }

  setEnabled(enabled) {
    this.isEnabled = enabled;
  }

  getConfig() {
    return {
      ...this.config,
      enabled: this.isEnabled,
      sessionId: this.sessionId,
      environment: this.environment,
      serviceName: this.serviceName,
    };
  }
}

// Create singleton instance
const graylogBackendService = new GraylogBackendService();

module.exports = {
  graylogBackendService,
  logDebug: (message, component, metadata) => graylogBackendService.debug(message, component, metadata),
  logInfo: (message, component, metadata) => graylogBackendService.info(message, component, metadata),
  logWarn: (message, component, metadata) => graylogBackendService.warn(message, component, metadata),
  logError: (message, component, error, metadata) => graylogBackendService.error(message, component, error, metadata),
  logRequest: (req, res, duration, metadata) => graylogBackendService.logRequest(req, res, duration, metadata),
  logDatabaseOperation: (operation, collection, duration, error, metadata) => 
    graylogBackendService.logDatabaseOperation(operation, collection, duration, error, metadata),
};
