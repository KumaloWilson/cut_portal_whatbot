import { Router } from "express"
import { WhatsAppController } from "../controllers/message.controller"

const router = Router()
const whatsappController = new WhatsAppController()

// Webhook for incoming WhatsApp messages
router.post("/webhook", (req, res) => {
  console.log("📨 POST /webhook called")
  whatsappController.handleMessage(req, res)
})

// Verification endpoint for WhatsApp Business API
router.get("/webhook", (req, res) => {
  console.log("🔍 GET /webhook called for verification")

  const mode = req.query["hub.mode"]
  const token = req.query["hub.verify_token"]
  const challenge = req.query["hub.challenge"]

  console.log("Verification params:", { mode, token, challenge })

  // In production, verify_token would be set in environment variables
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "your_verify_token"

  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ Webhook verified")
    res.status(200).send(challenge)
  } else {
    console.error("❌ Webhook verification failed")
    res.sendStatus(403)
  }
})

// Test endpoint for debugging
router.post("/test", async (req, res) => {
  console.log("🧪 Test endpoint called")

  try {
    const testMessage = {
      from: req.body.from || "+1234567890",
      message: req.body.message || "Hello",
      timestamp: new Date().toISOString(),
    }

    console.log("Test message:", testMessage)

    // Simulate webhook call
    req.body = testMessage
    await whatsappController.handleMessage(req, res)
  } catch (error: unknown) {
    console.error("Test error:", error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' })
  }
})

export default router
