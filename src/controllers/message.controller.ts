import type { Request, Response } from "express"
import { WhatsAppService } from "../services/whatsapp.service"
import { AnnouncementService } from "../services/announcement.service"
import { CourseService } from "../services/course.service"
import { SessionService } from "../services/session.service"
import { UserService } from "../services/user.service"

export class WhatsAppController {
  private userService: UserService
  private sessionService: SessionService
  private courseService: CourseService
  private announcementService: AnnouncementService
  private whatsappService: WhatsAppService

  constructor() {
    this.userService = new UserService()
    this.sessionService = new SessionService()
    this.courseService = new CourseService()
    this.announcementService = new AnnouncementService()
    this.whatsappService = new WhatsAppService()
  }

  // Handle incoming WhatsApp messages
  async handleMessage(req: Request, res: Response): Promise<void> {
    try {
      // Extract message details from the request
      // This structure will depend on the WhatsApp API you're using
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
    const user = await this.userService.getUserByPhone(phoneNumber)

    if (!user) {
      // Handle unregistered users
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "Sorry, your phone number is not registered in our system. Please contact the university administration.",
      )
      return
    }

    if (!session) {
      // New session, send welcome message
      session = await this.sessionService.createOrUpdateSession(phoneNumber, user.id, "main")
      await this.sendMainMenu(phoneNumber, user.name)
      return
    }

    // Process user input based on current menu
    const input = message.trim()

    switch (session.currentMenu) {
      case "main":
        await this.handleMainMenuInput(phoneNumber, input, user.id)
        break
      case "profile":
        await this.handleProfileMenuInput(phoneNumber, input, user.id)
        break
      case "courses":
        await this.handleCoursesMenuInput(phoneNumber, input, user.id)
        break
      case "grades":
        await this.handleGradesMenuInput(phoneNumber, input, user.id)
        break
      case "announcements":
        await this.handleAnnouncementsMenuInput(phoneNumber, input, user.id)
        break
      default:
        // Unknown menu state, reset to main menu
        await this.sessionService.updateSessionMenu(phoneNumber, "main")
        await this.sendMainMenu(phoneNumber, user.name)
    }
  }

  // Send the main menu
  private async sendMainMenu(phoneNumber: string, userName: string): Promise<void> {
    await this.whatsappService.sendMenuMessage(
      phoneNumber,
      "CUT Portal WhatsApp Bot",
      `Hello ${userName}, welcome to the CUT Student Portal. What would you like to do?`,
      ["View My Profile", "My Courses", "My Grades", "Announcements", "Help & Support"],
    )
  }

  // Handle main menu selections
  private async handleMainMenuInput(phoneNumber: string, input: string, userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId)
    if (!user) return

    switch (input) {
      case "1": // Profile
        await this.sessionService.updateSessionMenu(phoneNumber, "profile")
        await this.sendProfileInfo(phoneNumber, user)
        break
      case "2": // Courses
        await this.sessionService.updateSessionMenu(phoneNumber, "courses")
        await this.sendCoursesMenu(phoneNumber, user.studentId)
        break
      case "3": // Grades
        await this.sessionService.updateSessionMenu(phoneNumber, "grades")
        await this.sendGradesInfo(phoneNumber, user.studentId)
        break
      case "4": // Announcements
        await this.sessionService.updateSessionMenu(phoneNumber, "announcements")
        await this.sendAnnouncementsMenu(phoneNumber)
        break
      case "5": // Help
        await this.whatsappService.sendTextMessage(
          phoneNumber,
          "*Help & Support*\n\nFor technical support, please contact:\nEmail: support@cut.edu\nPhone: +123-456-7890\n\nStudent Services Office:\nLocation: Admin Building, Room 105\nHours: Mon-Fri, 8:00 AM - 4:30 PM\n\nReply with '0' to return to the main menu.",
        )
        break
      case "0": // Refresh main menu
        await this.sendMainMenu(phoneNumber, user.name)
        break
      default:
        await this.whatsappService.sendTextMessage(
          phoneNumber,
          "Sorry, I didn't understand that option. Please reply with a number from the menu.",
        )
        await this.sendMainMenu(phoneNumber, user.name)
    }
  }

  // Send profile information
  private async sendProfileInfo(phoneNumber: string, user: any): Promise<void> {
    const profileText = `*Your Profile*\n\nStudent ID: ${user.studentId}\nName: ${user.name}\nEmail: ${user.email}\nProgram: ${user.program}\nYear: ${user.year}\n\nReply with '0' to return to the main menu.`

    await this.whatsappService.sendTextMessage(phoneNumber, profileText)
  }

  // Handle profile menu inputs
  private async handleProfileMenuInput(phoneNumber: string, input: string, userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId)
    if (!user) return

    if (input === "0") {
      await this.sessionService.updateSessionMenu(phoneNumber, "main")
      await this.sendMainMenu(phoneNumber, user.name)
    } else {
      await this.whatsappService.sendTextMessage(phoneNumber, "Reply with '0' to return to the main menu.")
    }
  }

  // Send courses menu
  private async sendCoursesMenu(phoneNumber: string, studentId: string): Promise<void> {
    const courses = await this.courseService.getStudentCourses(studentId)

    if (courses.length === 0) {
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "*Your Courses*\n\nYou are not enrolled in any courses for the current semester.\n\nReply with '0' to return to the main menu.",
      )
      return
    }

    const coursesList = courses
      .map((course) => `- ${course.code}: ${course.name} (${course.credits} credits)`)
      .join("\n")
    const coursesText = `*Your Courses*\n\n${coursesList}\n\nReply with '0' to return to the main menu.`

    await this.whatsappService.sendTextMessage(phoneNumber, coursesText)
  }

  // Handle courses menu inputs
  private async handleCoursesMenuInput(phoneNumber: string, input: string, userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId)
    if (!user) return

    if (input === "0") {
      await this.sessionService.updateSessionMenu(phoneNumber, "main")
      await this.sendMainMenu(phoneNumber, user.name)
    } else {
      await this.whatsappService.sendTextMessage(phoneNumber, "Reply with '0' to return to the main menu.")
    }
  }

  // Send grades information
  private async sendGradesInfo(phoneNumber: string, studentId: string): Promise<void> {
    const grades = await this.courseService.getStudentGrades(studentId)

    if (grades.length === 0) {
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "*Your Grades*\n\nNo grades available for the current semester.\n\nReply with '0' to return to the main menu.",
      )
      return
    }

    const gradesList = grades
      .map((grade) => `- ${grade.courseName}: ${grade.score}% (${grade.semester} ${grade.year})`)
      .join("\n")

    const gradesText = `*Your Grades*\n\n${gradesList}\n\nReply with '0' to return to the main menu.`

    await this.whatsappService.sendTextMessage(phoneNumber, gradesText)
  }

  // Handle grades menu inputs
  private async handleGradesMenuInput(phoneNumber: string, input: string, userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId)
    if (!user) return

    if (input === "0") {
      await this.sessionService.updateSessionMenu(phoneNumber, "main")
      await this.sendMainMenu(phoneNumber, user.name)
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
  private async handleAnnouncementsMenuInput(phoneNumber: string, input: string, userId: string): Promise<void> {
    const user = await this.userService.getUserById(userId)
    if (!user) return

    if (input === "0") {
      await this.sessionService.updateSessionMenu(phoneNumber, "main")
      await this.sendMainMenu(phoneNumber, user.name)
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

