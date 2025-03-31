import type { Session } from "../models/session.model"

// In-memory session storage
// In production, use Redis or another distributed cache for scalability
const sessions: Map<string, Session> = new Map()

export class SessionService {
  async getSession(phoneNumber: string): Promise<Session | null> {
    return sessions.get(phoneNumber) || null
  }

  async createOrUpdateSession(phoneNumber: string, userId: string, menu: string): Promise<Session> {
    const session: Session = {
      userId,
      phoneNumber,
      currentMenu: menu,
      lastActivity: new Date(),
    }

    sessions.set(phoneNumber, session)
    return session
  }

  async updateSessionMenu(phoneNumber: string, menu: string): Promise<Session | null> {
    const session = sessions.get(phoneNumber)
    if (!session) return null

    session.currentMenu = menu
    session.lastActivity = new Date()
    sessions.set(phoneNumber, session)

    return session
  }

  async deleteSession(phoneNumber: string): Promise<boolean> {
    return sessions.delete(phoneNumber)
  }

  // Clean up inactive sessions (could be run periodically)
  async cleanupInactiveSessions(maxInactiveMinutes = 30): Promise<void> {
    const now = new Date()
    for (const [phoneNumber, session] of sessions.entries()) {
      const inactiveTime = (now.getTime() - session.lastActivity.getTime()) / (1000 * 60)
      if (inactiveTime > maxInactiveMinutes) {
        sessions.delete(phoneNumber)
      }
    }
  }
}

