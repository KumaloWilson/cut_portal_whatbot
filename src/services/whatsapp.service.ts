import axios from "axios"

export class WhatsAppService {
  private apiUrl: string
  private authToken: string

  constructor() {
    // Check environment variables
    if (!process.env.PHONE_NUMBER_ID) {
      console.error("❌ PHONE_NUMBER_ID environment variable is missing!")
    }
    if (!process.env.WHATSAPP_AUTH_TOKEN) {
      console.error("❌ WHATSAPP_AUTH_TOKEN environment variable is missing!")
    }

    this.apiUrl = `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}`
    this.authToken = process.env.WHATSAPP_AUTH_TOKEN || "dummy_token"

    console.log("🔧 WhatsApp Service initialized:")
    console.log("API URL:", this.apiUrl)
    console.log("Auth Token:", this.authToken ? "Set" : "Missing")
  }

  async sendTextMessage(to: string, text: string): Promise<boolean> {
    try {
      console.log(`📤 Attempting to send message to ${to}:`, text.substring(0, 50) + "...")

      // Check if we're using dummy token
      if (this.authToken === "dummy_token") {
        console.log("⚠️  Using dummy token - message will not be sent to WhatsApp")
        console.log("📝 Message content:", text)
        return true // Return true for testing purposes
      }

      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body: text },
      }

      console.log("📦 Payload:", JSON.stringify(payload, null, 2))

      const response = await axios.post(`${this.apiUrl}/messages`, payload, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      })

      console.log("✅ WhatsApp API Response:", response.status, response.data)
      return true
    } catch (error) {
      console.error("❌ Error sending WhatsApp message:", error)

      if (axios.isAxiosError(error)) {
        console.error("Response status:", error.response?.status)
        console.error("Response data:", error.response?.data)
        console.error("Request config:", {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        })
      }

      return false
    }
  }

  async sendMenuMessage(to: string, header: string, body: string, options: string[]): Promise<boolean> {
    // Format the menu options with numbers
    const formattedOptions = options.map((option, index) => `${index + 1}. ${option}`).join("\n")
    const message = `*${header}*\n\n${body}\n\n${formattedOptions}\n\nReply with a number to select an option.`

    return this.sendTextMessage(to, message)
  }
}
