import { WhatsAppService } from "../services/whatsapp.service"
import { PortalApiService } from "../services/portal-api.service"
import { SessionService } from "../services/session.service"
import type { Session } from "../models/session.model"

export class ProfileHandler {
  private whatsappService: WhatsAppService
  private portalApiService: PortalApiService
  private sessionService: SessionService

  constructor() {
    this.whatsappService = new WhatsAppService()
    this.portalApiService = new PortalApiService()
    this.sessionService = new SessionService()
  }

  async handleProfileMenu(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendMenuMessage(phoneNumber, "👤 Student Profile", "What would you like to view?", [
      "Personal Information",
      "Academic Details",
      "Contact Information",
      "Account Status",
      "🔙 Back to Main Menu",
    ])
  }

  async handleProfileInput(phoneNumber: string, input: string, session: Session): Promise<void> {
    switch (input) {
      case "1":
        await this.showPersonalInfo(phoneNumber, session)
        break
      case "2":
        await this.showAcademicDetails(phoneNumber, session)
        break
      case "3":
        await this.showContactInfo(phoneNumber, session)
        break
      case "4":
        await this.showAccountStatus(phoneNumber, session)
        break
      case "5":
      case "0":
        await this.sessionService.updateSessionMenu(phoneNumber, "main")
        // Will be handled by main controller
        break
      default:
        await this.whatsappService.sendTextMessage(
          phoneNumber,
          "❌ Invalid option. Please select a number from the menu.",
        )
        await this.handleProfileMenu(phoneNumber, session)
    }
  }

  private async showPersonalInfo(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Loading your personal information...")

    const homeData = await this.portalApiService.getHomeData(session.username!, session.authToken!)

    if (!homeData.success) {
      await this.handleApiError(phoneNumber, homeData.error!, homeData.requiresReauth)
      return
    }

    const profile = homeData.data!.profile
    const personalInfo = `👤 *Personal Information*

📛 *Name:* ${profile.title} ${profile.first_name} ${profile.surname}
🆔 *Student ID:* ${profile.student_id}
🎂 *Date of Birth:* ${new Date(profile.date_of_birth).toLocaleDateString()}
🌍 *Nationality:* ${profile.nationality}
🏠 *Place of Birth:* ${profile.place_of_birth}
👤 *Gender:* ${profile.sex}
💒 *Marital Status:* ${profile.marital_status}
⛪ *Religion:* ${profile.religion}
🆔 *National ID:* ${profile.national_id}

Reply with *0* to return to profile menu or *00* for main menu.`

    await this.whatsappService.sendTextMessage(phoneNumber, personalInfo)
  }

  private async showAcademicDetails(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Loading your academic details...")

    const homeData = await this.portalApiService.getHomeData(session.username!, session.authToken!)

    if (!homeData.success) {
      await this.handleApiError(phoneNumber, homeData.error!, homeData.requiresReauth)
      return
    }

    const registration = homeData.data!.registration
    const academicInfo = `🎓 *Academic Information*

📚 *Program:* ${registration.program.programme_name}
🏫 *Faculty:* ${registration.program.faculty_name}
📊 *Level:* ${registration.program.level}
📅 *Current Period:* ${registration.period.period_name}
✅ *Registration Status:* ${registration.is_registered ? "Registered" : "Not Registered"}
🎯 *Attendance Type:* ${registration.program.attendance_type_name}
🏆 *Completed:* ${registration.program.completed ? "Yes" : "No"}

📖 *Enrolled Modules:* ${registration.modules.length}

Reply with *0* to return to profile menu or *00* for main menu.`

    await this.whatsappService.sendTextMessage(phoneNumber, academicInfo)
  }

  private async showContactInfo(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Loading your contact information...")

    const homeData = await this.portalApiService.getHomeData(session.username!, session.authToken!)

    if (!homeData.success) {
      await this.handleApiError(phoneNumber, homeData.error!, homeData.requiresReauth)
      return
    }

    const profile = homeData.data!.profile
    const contactInfo = `📞 *Contact Information*

📧 *Email:* ${profile.email_address}
📱 *Phone:* ${profile.phone_numbers}
🏠 *Contact Address:* ${profile.contact_address}
🏡 *Permanent Address:* ${profile.permanent_home_address}

Reply with *0* to return to profile menu or *00* for main menu.`

    await this.whatsappService.sendTextMessage(phoneNumber, contactInfo)
  }

  private async showAccountStatus(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Loading your account status...")

    const homeData = await this.portalApiService.getHomeData(session.username!, session.authToken!)

    if (!homeData.success) {
      await this.handleApiError(phoneNumber, homeData.error!, homeData.requiresReauth)
      return
    }

    const accounts = homeData.data!.accounts
    const vle = homeData.data!.vle

    const accountStatus = `🔐 *Account Status*

📶 *WiFi Access:* ${accounts.wifi ? "✅ Active" : "❌ Inactive"}
🆔 *Student ID Card:* ${accounts.student_id_card ? "✅ Active" : "❌ Inactive"}
🍽️ *Canteen Access:* ${accounts.canteen ? "✅ Active" : "❌ Inactive"}
🏠 *Accommodation:* ${accounts.accomodation || "Not Assigned"}
💻 *VLE Status:* ${vle.status ? "✅ Active" : "❌ Inactive"}
📚 *Classes Ready:* ${vle.classes_ready}

Reply with *0* to return to profile menu or *00* for main menu.`

    await this.whatsappService.sendTextMessage(phoneNumber, accountStatus)
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
        `❌ *Error*\n\n${error}\n\nReply with *0* to return to profile menu or *00* for main menu.`,
      )
    }
  }
}
