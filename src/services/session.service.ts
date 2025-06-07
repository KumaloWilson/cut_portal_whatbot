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
      isAuthenticated: false,
    }

    sessions.set(phoneNumber, session)
    return session
  }

  async updateSessionMenu(phoneNumber: string, menu: string): Promise<Session | null> {
    const session = sessions.get(phoneNumber)
    if (!session) return null

    session.currentMenu = menu
    session.lastActivity = new Date()
    // Clear temp data when changing menus (except for specific flows)
    if (!menu.includes("_")) {
      session.tempData = undefined
    }
    sessions.set(phoneNumber, session)

    return session
  }

  async updateSessionAuth(phoneNumber: string, authToken: string, username: string): Promise<Session | null> {
    const session = sessions.get(phoneNumber)
    if (!session) return null

    session.isAuthenticated = true
    session.authToken = authToken
    session.username = username
    session.lastActivity = new Date()
    // Clear login flow state
    session.awaitingUsername = false
    session.awaitingPassword = false
    session.tempUsername = undefined
    sessions.set(phoneNumber, session)

    return session
  }

  async setAwaitingUsername(phoneNumber: string): Promise<Session | null> {
    const session = sessions.get(phoneNumber)
    if (!session) return null

    session.awaitingUsername = true
    session.awaitingPassword = false
    session.lastActivity = new Date()
    sessions.set(phoneNumber, session)

    return session
  }

  async setAwaitingPassword(phoneNumber: string, username: string): Promise<Session | null> {
    const session = sessions.get(phoneNumber)
    if (!session) return null

    session.awaitingUsername = false
    session.awaitingPassword = true
    session.tempUsername = username
    session.lastActivity = new Date()
    sessions.set(phoneNumber, session)

    return session
  }

  async deleteSession(phoneNumber: string): Promise<boolean> {
    return sessions.delete(phoneNumber)
  }

  async logoutSession(phoneNumber: string): Promise<Session | null> {
    const session = sessions.get(phoneNumber)
    if (!session) return null

    session.isAuthenticated = false
    session.authToken = undefined
    session.username = undefined
    session.awaitingUsername = false
    session.awaitingPassword = false
    session.tempUsername = undefined
    session.currentMenu = "login"
    session.lastActivity = new Date()
    sessions.set(phoneNumber, session)

    return session
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
