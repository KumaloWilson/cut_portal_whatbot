import type { Request, Response } from "express"
import { WhatsAppService } from "../services/whatsapp.service"
import { AnnouncementService } from "../services/announcement.service"
import { CourseService } from "../services/course.service"
import { SessionService } from "../services/session.service"
import { UserService } from "../services/user.service"
import { AuthService } from "../services/auth.service"
import { WiFiHandler } from "../handlers/wifi.handler"
import { GradesHandler } from "../handlers/grades.handler"

export class WhatsAppController {
  private userService: UserService
  private sessionService: SessionService
  private courseService: CourseService
  private announcementService: AnnouncementService
  private whatsappService: WhatsAppService
  private authService: AuthService
  private wifiHandler: WiFiHandler
  private gradesHandler: GradesHandler

  constructor() {
    this.userService = new UserService()
    this.sessionService = new SessionService()
    this.courseService = new CourseService()
    this.announcementService = new AnnouncementService()
    this.whatsappService = new WhatsAppService()
    this.authService = new AuthService()
    this.wifiHandler = new WiFiHandler()
    this.gradesHandler = new GradesHandler()
  }

  // Handle incoming WhatsApp messages
  async handleMessage(req: Request, res: Response): Promise<void> {
    try {
      // Extract message details from the request
      const { from, message, timestamp } = req.body

      // Process the message
      await this.processMessage(from, message)

      // Respond to WhatsApp API
      res.status(200).json({ status: "success" })
    } catch (error) {
      console.error("Error handling WhatsApp message:", error)
      res.status(500).json({ status: "error", message: "Internal server error" })
    }
  }

  // Process incoming messages and determine the appropriate response
  private async processMessage(phoneNumber: string, message: string): Promise<void> {
    // Get or create user session
    let session = await this.sessionService.getSession(phoneNumber)

    if (!session) {
      // New session, start with login
      session = await this.sessionService.createOrUpdateSession(phoneNumber, "guest", "login")
      await this.sendWelcomeMessage(phoneNumber)
      return
    }

    const input = message.trim()

    // Handle login flow first
    if (!session.isAuthenticated) {
      await this.handleLoginFlow(phoneNumber, input, session)
      return
    }

    // Process authenticated user input based on current menu
    switch (session.currentMenu) {
      case "main":
        await this.handleMainMenuInput(phoneNumber, input, session)
        break
      case "profile":
        await this.handleProfileMenuInput(phoneNumber, input, session)
        break
      case "courses":
        await this.handleCoursesMenuInput(phoneNumber, input, session)
        break
      case "grades":
        await this.gradesHandler.handleGradesMenu(phoneNumber, session)
        break
      case "grades_period_selection":
        await this.gradesHandler.handlePeriodSelection(phoneNumber, input, session)
        break
      case "grades_module_selection":
        await this.gradesHandler.handleModuleSelection(phoneNumber, input, session)
        break
      case "grades_balance_error":
        await this.gradesHandler.handleBalanceErrorActions(phoneNumber, input, session)
        break
      case "grades_empty_results":
        await this.gradesHandler.handleEmptyResultsNavigation(phoneNumber, input, session)
        break
      case "wifi":
        await this.wifiHandler.handleWiFiInput(phoneNumber, input, session)
        break
      case "wifi_quick_actions":
        await this.wifiHandler.handleWiFiQuickActions(phoneNumber, input, session)
        break
      case "announcements":
        await this.handleAnnouncementsMenuInput(phoneNumber, input, session)
        break
      default:
        // Unknown menu state, reset to main menu
        await this.sessionService.updateSessionMenu(phoneNumber, "main")
        await this.sendMainMenu(phoneNumber, session.username!)
    }
  }

  // Send welcome message and prompt for login
  private async sendWelcomeMessage(phoneNumber: string): Promise<void> {
    await this.whatsappService.sendTextMessage(
      phoneNumber,
      "*Welcome to CUT Portal WhatsApp Bot* 🎓\n\nTo access your student information, please login with your portal credentials.\n\nPlease enter your *username* (Student ID):",
    )
    await this.sessionService.setAwaitingUsername(phoneNumber)
  }

  // Handle login flow
  private async handleLoginFlow(phoneNumber: string, input: string, session: any): Promise<void> {
    if (session.awaitingUsername) {
      // User provided username
      const username = input.trim()
      if (!username) {
        await this.whatsappService.sendTextMessage(phoneNumber, "Please enter a valid username:")
        return
      }

      await this.sessionService.setAwaitingPassword(phoneNumber, username)
      await this.whatsappService.sendTextMessage(phoneNumber, "Please enter your *password*:")
      return
    }

    if (session.awaitingPassword && session.tempUsername) {
      // User provided password, attempt login
      const password = input.trim()
      if (!password) {
        await this.whatsappService.sendTextMessage(phoneNumber, "Please enter a valid password:")
        return
      }

      await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Logging you in, please wait...")

      try {
        const loginResult = await this.authService.getAuthToken({
          username: session.tempUsername,
          password: password,
          login: "Login",
        })

        if (loginResult.success && loginResult.token && loginResult.username) {
          // Login successful
          await this.sessionService.updateSessionAuth(phoneNumber, loginResult.token, loginResult.username)
          await this.sessionService.updateSessionMenu(phoneNumber, "main")

          await this.whatsappService.sendTextMessage(
            phoneNumber,
            `✅ *Login Successful!*\n\nWelcome ${loginResult.username}!\n\nYou can now access your student information.`,
          )

          // Show main menu
          await this.sendMainMenu(phoneNumber, loginResult.username)
        } else {
          // Login failed
          await this.whatsappService.sendTextMessage(
            phoneNumber,
            `❌ *Login Failed*\n\n${loginResult.error || "Invalid credentials"}\n\nPlease try again. Enter your *username*:`,
          )
          await this.sessionService.setAwaitingUsername(phoneNumber)
        }
      } catch (error) {
        console.error("Login error:", error)
        await this.whatsappService.sendTextMessage(
          phoneNumber,
          "❌ *Login Error*\n\nSomething went wrong. Please try again later or contact support.\n\nEnter your *username* to retry:",
        )
        await this.sessionService.setAwaitingUsername(phoneNumber)
      }
    }
  }

  // Send the main menu
  private async sendMainMenu(phoneNumber: string, username: string): Promise<void> {
    await this.whatsappService.sendMenuMessage(
      phoneNumber,
      "CUT Portal WhatsApp Bot",
      `Hello ${username}, what would you like to do?`,
      ["View My Profile", "My Courses", "My Grades", "📶 WiFi Management", "Announcements", "Logout", "Help & Support"],
    )
  }

  // Handle main menu selections
  private async handleMainMenuInput(phoneNumber: string, input: string, session: any): Promise<void> {
    switch (input) {
      case "1": // Profile
        await this.sessionService.updateSessionMenu(phoneNumber, "profile")
        await this.sendProfileInfo(phoneNumber, session)
        break
      case "2": // Courses
        await this.sessionService.updateSessionMenu(phoneNumber, "courses")
        await this.sendCoursesMenu(phoneNumber, session)
        break
      case "3": // Grades
        await this.sessionService.updateSessionMenu(phoneNumber, "grades")
        await this.gradesHandler.handleGradesMenu(phoneNumber, session)
        break
      case "4": // WiFi Management
        await this.sessionService.updateSessionMenu(phoneNumber, "wifi")
        await this.wifiHandler.handleWiFiMenu(phoneNumber, session)
        break
      case "5": // Announcements
        await this.sessionService.updateSessionMenu(phoneNumber, "announcements")
        await this.sendAnnouncementsMenu(phoneNumber)
        break
      case "6": // Logout
        await this.handleLogout(phoneNumber)
        break
      case "7": // Help
        await this.whatsappService.sendTextMessage(
          phoneNumber,
          "*Help & Support*\n\nFor technical support, please contact:\nEmail: support@cut.edu\nPhone: +123-456-7890\n\nStudent Services Office:\nLocation: Admin Building, Room 105\nHours: Mon-Fri, 8:00 AM - 4:30 PM\n\nReply with '0' to return to the main menu.",
        )
        break
      case "0": // Refresh main menu
        await this.sendMainMenu(phoneNumber, session.username)
        break
      default:
        await this.whatsappService.sendTextMessage(
          phoneNumber,
          "Sorry, I didn't understand that option. Please reply with a number from the menu.",
        )
        await this.sendMainMenu(phoneNumber, session.username)
    }
  }

  // Handle logout
  private async handleLogout(phoneNumber: string): Promise<void> {
    await this.sessionService.logoutSession(phoneNumber)
    await this.whatsappService.sendTextMessage(
      phoneNumber,
      "✅ *Logged Out Successfully*\n\nThank you for using CUT Portal WhatsApp Bot. To access your information again, please login with your credentials.\n\nEnter your *username* to login:",
    )
    await this.sessionService.setAwaitingUsername(phoneNumber)
  }

  // Send profile information (placeholder - will need API integration)
  private async sendProfileInfo(phoneNumber: string, session: any): Promise<void> {
    const profileText = `*Your Profile*\n\nStudent ID: ${session.username}\nAuthenticated: ✅\nToken: ${session.authToken?.substring(0, 8)}...\n\n_Note: Full profile data will be available once API integration is complete._\n\nReply with '0' to return to the main menu.`

    await this.whatsappService.sendTextMessage(phoneNumber, profileText)
  }

  // Handle profile menu inputs
  private async handleProfileMenuInput(phoneNumber: string, input: string, session: any): Promise<void> {
    if (input === "0") {
      await this.sessionService.updateSessionMenu(phoneNumber, "main")
      await this.sendMainMenu(phoneNumber, session.username)
    } else {
      await this.whatsappService.sendTextMessage(phoneNumber, "Reply with '0' to return to the main menu.")
    }
  }

  // Send courses menu (placeholder - will need API integration)
  private async sendCoursesMenu(phoneNumber: string, session: any): Promise<void> {
    const coursesText = `*Your Courses*\n\n_Course data will be loaded from the portal API using your authentication token._\n\nToken: ${session.authToken?.substring(0, 8)}...\n\nReply with '0' to return to the main menu.`

    await this.whatsappService.sendTextMessage(phoneNumber, coursesText)
  }

  // Handle courses menu inputs
  private async handleCoursesMenuInput(phoneNumber: string, input: string, session: any): Promise<void> {
    if (input === "0") {
      await this.sessionService.updateSessionMenu(phoneNumber, "main")
      await this.sendMainMenu(phoneNumber, session.username)
    } else {
      await this.whatsappService.sendTextMessage(phoneNumber, "Reply with '0' to return to the main menu.")
    }
  }

  // Send announcements menu
  private async sendAnnouncementsMenu(phoneNumber: string): Promise<void> {
    const announcements = await this.announcementService.getAnnouncements()

    if (announcements.length === 0) {
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "*Announcements*\n\nThere are no current announcements.\n\nReply with '0' to return to the main menu.",
      )
      return
    }

    const announcementsList = announcements
      .map(
        (announcement, index) =>
          `${index + 1}. ${announcement.important ? "🔴 " : ""}${announcement.title} (${announcement.date.toLocaleDateString()})`,
      )
      .join("\n")

    const announcementsText = `*Announcements*\n\n${announcementsList}\n\nReply with a number to view details or '0' to return to the main menu.`

    await this.whatsappService.sendTextMessage(phoneNumber, announcementsText)
  }

  // Handle announcements menu inputs
  private async handleAnnouncementsMenuInput(phoneNumber: string, input: string, session: any): Promise<void> {
    if (input === "0") {
      await this.sessionService.updateSessionMenu(phoneNumber, "main")
      await this.sendMainMenu(phoneNumber, session.username)
      return
    }

    const announcementIndex = Number.parseInt(input) - 1
    const announcements = await this.announcementService.getAnnouncements()

    if (isNaN(announcementIndex) || announcementIndex < 0 || announcementIndex >= announcements.length) {
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "Invalid selection. Please reply with a valid announcement number or '0' to return to the main menu.",
      )
      return
    }

    const announcement = announcements[announcementIndex]
    const announcementText = `*${announcement.title}*\n${announcement.date.toLocaleDateString()}\n\n${announcement.content}\n\nReply with '0' to return to the main menu or any other number to view another announcement.`

    await this.whatsappService.sendTextMessage(phoneNumber, announcementText)
  }
}
