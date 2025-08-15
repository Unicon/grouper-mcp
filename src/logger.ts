import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

export class Logger {
  private logDir: string;
  private logFile: string;
  private errorFile: string;

  constructor() {
    this.logDir = process.env.GROUPER_LOG_DIR || join(homedir(), '.grouper-mcp', 'logs');
    this.logFile = join(this.logDir, 'grouper-mcp.log');
    this.errorFile = join(this.logDir, 'grouper-mcp-errors.log');
    
    this.ensureLogDir();
  }

  private ensureLogDir(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatMessage(level: string, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}\n`;
  }

  info(message: string, context?: any): void {
    const formatted = this.formatMessage('INFO', message, context);
    appendFileSync(this.logFile, formatted);
    console.log(message, context || '');
  }

  error(message: string, context?: any): void {
    const formatted = this.formatMessage('ERROR', message, context);
    appendFileSync(this.errorFile, formatted);
    appendFileSync(this.logFile, formatted);
    console.error(message, context || '');
  }

  debug(message: string, context?: any): void {
    if (process.env.GROUPER_DEBUG === 'true') {
      const formatted = this.formatMessage('DEBUG', message, context);
      appendFileSync(this.logFile, formatted);
      console.log(`[DEBUG] ${message}`, context || '');
    }
  }

  logRequest(method: string, url: string, headers?: any, body?: any): void {
    this.debug('HTTP Request', {
      method,
      url,
      headers: this.sanitizeHeaders(headers),
      body: body ? JSON.stringify(body) : undefined
    });
  }

  logResponse(url: string, status: number, statusText: string, body?: any): void {
    const level = status >= 400 ? 'ERROR' : 'DEBUG';
    const message = `HTTP Response: ${status} ${statusText}`;
    
    if (level === 'ERROR') {
      this.error(message, {
        url,
        status,
        statusText,
        body: body ? JSON.stringify(body) : undefined
      });
    } else {
      this.debug(message, {
        url,
        status,
        body: body ? JSON.stringify(body) : undefined
      });
    }
  }

  private sanitizeHeaders(headers?: any): any {
    if (!headers) return undefined;
    
    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      sanitized.Authorization = '[REDACTED]';
    }
    return sanitized;
  }
}

export const logger = new Logger();