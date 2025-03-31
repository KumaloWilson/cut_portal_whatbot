import app from "./app"
import { SessionService } from "./services/session.service"

const PORT = process.env.PORT || 3000

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Set up periodic session cleanup
const sessionService = new SessionService()
setInterval(
  () => {
    sessionService.cleanupInactiveSessions()
  },
  15 * 60 * 1000,
) // Run every 15 minutes

