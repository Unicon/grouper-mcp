import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger.js';

interface Session {
  id: string;
  transport: Transport;
  createdAt: Date;
  lastAccessedAt: Date;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private maxIdleMinutes: number = 30,
    private cleanupIntervalMinutes: number = 5
  ) {
    // Periodically clean up idle sessions
    this.cleanupInterval = setInterval(
      () => this.cleanupIdleSessions(),
      cleanupIntervalMinutes * 60 * 1000
    );
  }

  createSession(transport: Transport): string {
    const sessionId = uuidv4();
    const session: Session = {
      id: sessionId,
      transport,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    logger.info(`Session created: ${sessionId}`);
    return sessionId;
  }

  getSession(sessionId: string): Transport | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessedAt = new Date();
      return session.transport;
    }
    return null;
  }

  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      logger.info(`Session deleted: ${sessionId}`);
    }
    return deleted;
  }

  private cleanupIdleSessions(): void {
    const now = new Date();
    const maxIdleMs = this.maxIdleMinutes * 60 * 1000;

    for (const [sessionId, session] of this.sessions.entries()) {
      const idleMs = now.getTime() - session.lastAccessedAt.getTime();
      if (idleMs > maxIdleMs) {
        this.sessions.delete(sessionId);
        logger.info(`Session expired due to inactivity: ${sessionId}`);
      }
    }
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  shutdown(): void {
    clearInterval(this.cleanupInterval);
    this.sessions.clear();
  }
}
