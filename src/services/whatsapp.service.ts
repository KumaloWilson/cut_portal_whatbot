import axios from "axios"

export class WhatsAppService {
    private apiUrl: string
    private authToken: string
  
    constructor() {
      // In production, these would come from environment variables
      this.apiUrl = `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}`
      this.authToken = process.env.WHATSAPP_AUTH_TOKEN || "dummy_token"
    }
  
    async sendTextMessage(to: string, text: string): Promise<boolean> {
      try {
        // In a real implementation, this would make an actual API call
        console.log(`Sending message to ${to}: ${text}`)
  
        // Simulate API call (in production, use actual WhatsApp Business API)
        
        await axios.post(
          `${this.apiUrl}/messages`,
          {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { body: text }
          },
          {
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
  
        return true
      } catch (error) {
        console.error("Error sending WhatsApp message:", error)
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
