import { Router } from "express"
import { WhatsAppController } from "../controllers/message.controller"

const router = Router()
const whatsappController = new WhatsAppController()

// Webhook for incoming WhatsApp messages
router.post("/webhook", (req, res) => whatsappController.handleMessage(req, res))

// Verification endpoint for WhatsApp Business API
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"]
  const token = req.query["hub.verify_token"]
  const challenge = req.query["hub.challenge"]

  // In production, verify_token would be set in environment variables
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "your_verify_token"


  if (mode === "subscribe" && token === verifyToken) {
    console.log("Webhook verified")
    res.status(200).send(challenge)
  } else {
    console.error("Webhook verification failed")
    res.sendStatus(403)
  }
})

export default router
