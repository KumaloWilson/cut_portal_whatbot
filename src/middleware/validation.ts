import type { Request, Response, NextFunction } from "express"
import { AppError } from "./error_handler"

export const validateWebhook = (req: Request, res: Response, next: NextFunction) => {
  // Validate WhatsApp webhook payload
  const { body } = req

  if (!body || !body.object || !body.entry || !Array.isArray(body.entry)) {
    return next(new AppError("Invalid webhook payload", 400))
  }

  // Extract message data
  try {
    const entry = body.entry[0]
    const changes = entry.changes?.[0]
    const value = changes?.value
    const messages = value?.messages

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return next(new AppError("No messages in webhook payload", 400))
    }

    // Extract and add message data to request
    const message = messages[0]
    const from = message.from
    const messageBody = message.text?.body || ""
    const timestamp = message.timestamp

    // Add extracted data to request object for controller to use
    req.body = {
      from,
      message: messageBody,
      timestamp,
    }

    next()
  } catch (error) {
    next(new AppError("Error processing webhook payload", 400))
  }
}

