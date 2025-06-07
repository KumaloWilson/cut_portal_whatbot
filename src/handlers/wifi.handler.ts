import { WhatsAppService } from "../services/whatsapp.service"
import { PortalApiService } from "../services/portal-api.service"
import { SessionService } from "../services/session.service"
import type { Session } from "../models/session.model"

export class WiFiHandler {
  private whatsappService: WhatsAppService
  private portalApiService: PortalApiService
  private sessionService: SessionService

  constructor() {
    this.whatsappService = new WhatsAppService()
    this.portalApiService = new PortalApiService()
    this.sessionService = new SessionService()
  }

  async handleWiFiMenu(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendMenuMessage(phoneNumber, "📶 WiFi Management", "Manage your campus WiFi access:", [
      "Check WiFi Status",
      "Activate WiFi",
      "WiFi Help & Info",
      "🔙 Back to Main Menu",
    ])
  }

  async handleWiFiInput(phoneNumber: string, input: string, session: Session): Promise<void> {
    switch (input) {
      case "1":
        await this.checkWiFiStatus(phoneNumber, session)
        break
      case "2":
        await this.activateWiFi(phoneNumber, session)
        break
      case "3":
        await this.showWiFiHelp(phoneNumber)
        break
      case "4":
      case "0":
        await this.sessionService.updateSessionMenu(phoneNumber, "main")
        break
      default:
        await this.whatsappService.sendTextMessage(
          phoneNumber,
          "❌ Invalid option. Please select a number from the menu.",
        )
        await this.handleWiFiMenu(phoneNumber, session)
    }
  }

  private async checkWiFiStatus(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Checking your WiFi status...")

    try {
      const wifiStatus = await this.portalApiService.getWiFiStatus(session.username!, session.authToken!)

      if (!wifiStatus.success) {
        await this.handleApiError(phoneNumber, wifiStatus.error!, wifiStatus.requiresReauth)
        return
      }

      const statusIcon = wifiStatus.data!.isActive ? "🟢" : "🔴"
      const statusText = wifiStatus.data!.isActive ? "Active" : "Inactive"
      const actionText = wifiStatus.data!.isActive
        ? "Your WiFi access is currently active and ready to use."
        : "Your WiFi access is currently inactive. You can activate it using option 2."

      const statusMessage = `📶 *WiFi Status*

${statusIcon} *Status:* ${statusText}

${actionText}

🔧 *Quick Actions:*
Reply *1* to refresh status
Reply *2* to activate WiFi
Reply *0* to return to WiFi menu
Reply *00* for main menu`

      await this.whatsappService.sendTextMessage(phoneNumber, statusMessage)

      // Store current status for quick actions
      session.tempData = {
        currentWiFiStatus: wifiStatus.data!.isActive,
        lastChecked: new Date(),
      }
    } catch (error) {
      console.error("WiFi status check error:", error)
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "❌ *Error*\n\nFailed to check WiFi status. Please try again later.\n\nReply with *0* to return to WiFi menu.",
      )
    }
  }

  private async activateWiFi(phoneNumber: string, session: Session): Promise<void> {
    // First check current status
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Checking current WiFi status...")

    const currentStatus = await this.portalApiService.getWiFiStatus(session.username!, session.authToken!)

    if (!currentStatus.success) {
      await this.handleApiError(phoneNumber, currentStatus.error!, currentStatus.requiresReauth)
      return
    }

    if (currentStatus.data!.isActive) {
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "✅ *WiFi Already Active*\n\nYour WiFi access is already active and ready to use.\n\n📶 You can connect to the campus WiFi network now.\n\nReply with *0* to return to WiFi menu or *00* for main menu.",
      )
      return
    }

    // Proceed with activation
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Activating your WiFi access...")

    try {
      const activationResult = await this.portalApiService.activateWiFi(session.username!, session.authToken!)

      if (!activationResult.success) {
        await this.handleApiError(phoneNumber, activationResult.error!, activationResult.requiresReauth)
        return
      }

      const result = activationResult.data!

      if (!result.error) {
        // Activation successful
        await this.whatsappService.sendTextMessage(
          phoneNumber,
          `✅ *WiFi Activation Successful!*

${result.message}

📶 *Next Steps:*
1. Connect to the campus WiFi network
2. Use your student credentials to login
3. Enjoy internet access on campus

🔧 *WiFi Network Details:*
Network: CUT-Student-WiFi
Username: Your student ID
Password: Your portal password

Reply with *1* to check status again
Reply with *0* to return to WiFi menu
Reply with *00* for main menu`,
        )
      } else {
        // Activation failed
        await this.whatsappService.sendTextMessage(
          phoneNumber,
          `❌ *WiFi Activation Failed*

${result.message}

Please try again later or contact IT support if the problem persists.

📞 *IT Support:*
Email: itsupport@cut.ac.zw
Phone: +263-4-123456

Reply with *2* to try again
Reply with *0* to return to WiFi menu
Reply with *00* for main menu`,
        )
      }
    } catch (error) {
      console.error("WiFi activation error:", error)
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "❌ *Activation Error*\n\nFailed to activate WiFi. Please try again later.\n\nReply with *0* to return to WiFi menu.",
      )
    }
  }

  private async showWiFiHelp(phoneNumber: string): Promise<void> {
    const helpMessage = `📶 *WiFi Help & Information*

🔧 *How to Connect:*
1. Activate WiFi through this bot (option 2)
2. Connect to "CUT-Student-WiFi" network
3. Open browser and login with:
   • Username: Your student ID
   • Password: Your portal password

📋 *Troubleshooting:*
• Ensure WiFi is activated first
• Check your credentials are correct
• Try forgetting and reconnecting to network
• Restart your device if needed

⚠️ *Important Notes:*
• WiFi activation may take a few minutes
• You need to re-activate if deactivated
• Use responsibly and follow IT policies

📞 *Need Help?*
IT Support: itsupport@cut.ac.zw
Phone: +263-4-123456
Office: IT Building, Room 101

Reply with *0* to return to WiFi menu or *00* for main menu.`

    await this.whatsappService.sendTextMessage(phoneNumber, helpMessage)
  }

  async handleWiFiQuickActions(phoneNumber: string, input: string, session: Session): Promise<void> {
    switch (input) {
      case "1":
        await this.checkWiFiStatus(phoneNumber, session)
        break
      case "2":
        await this.activateWiFi(phoneNumber, session)
        break
      case "0":
        await this.sessionService.updateSessionMenu(phoneNumber, "wifi")
        await this.handleWiFiMenu(phoneNumber, session)
        break
      case "00":
        await this.sessionService.updateSessionMenu(phoneNumber, "main")
        break
      default:
        await this.whatsappService.sendTextMessage(
          phoneNumber,
          "❌ Invalid option. Please use the available quick actions.",
        )
    }
  }

  private async handleApiError(phoneNumber: string, error: string, requiresReauth?: boolean): Promise<void> {
    if (requiresReauth) {
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "🔐 *Session Expired*\n\nYour session has expired. Please login again.\n\nEnter your *username*:",
      )
      await this.sessionService.logoutSession(phoneNumber)
      await this.sessionService.setAwaitingUsername(phoneNumber)
    } else {
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        `❌ *Error*\n\n${error}\n\nReply with *0* to return to WiFi menu or *00* for main menu.`,
      )
    }
  }
}
