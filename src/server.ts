import app from "./app"
import { SessionService } from "./services/session.service"
import { checkEnvironment } from "./debug/environment-check"

const PORT = process.env.PORT || 3000

// Check environment variables on startup
checkEnvironment()

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📡 Webhook URL: http://localhost:${PORT}/api/whatsapp/webhook`)
  console.log(`🔍 Health check: http://localhost:${PORT}/health`)
})

// Set up periodic session cleanup (runs every 15 minutes)
const sessionService = new SessionService()
setInterval(
  () => {
    sessionService.cleanupInactiveSessions()
  },
  15 * 60 * 1000,
)
