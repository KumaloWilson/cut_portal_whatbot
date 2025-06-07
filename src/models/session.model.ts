export interface Session {
  userId: string
  phoneNumber: string
  currentMenu: string
  lastActivity: Date
  // Authentication data
  isAuthenticated: boolean
  authToken?: string
  username?: string
  // Login flow state
  awaitingUsername?: boolean
  awaitingPassword?: boolean
  tempUsername?: string
  // Temporary data for complex flows
  tempData?: any
}
