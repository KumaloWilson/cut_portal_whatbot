import { WhatsAppService } from "../services/whatsapp.service"
import { PortalApiService } from "../services/portal-api.service"
import { SessionService } from "../services/session.service"
import type { Session } from "../models/session.model"
import type { Module } from "../models/portal-api.model"

export class CoursesHandler {
  private whatsappService: WhatsAppService
  private portalApiService: PortalApiService
  private sessionService: SessionService

  constructor() {
    this.whatsappService = new WhatsAppService()
    this.portalApiService = new PortalApiService()
    this.sessionService = new SessionService()
  }

  async handleCoursesMenu(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendMenuMessage(phoneNumber, "📚 My Courses", "What would you like to view?", [
      "Current Modules",
      "Module Details",
      "Past Exam Papers",
      "Course Materials",
      "🔙 Back to Main Menu",
    ])
  }

  async handleCoursesInput(phoneNumber: string, input: string, session: Session): Promise<void> {
    switch (input) {
      case "1":
        await this.showCurrentModules(phoneNumber, session)
        break
      case "2":
        await this.showModuleSelection(phoneNumber, session)
        break
      case "3":
        await this.showPastExamPapers(phoneNumber, session)
        break
      case "4":
        await this.showCourseMaterials(phoneNumber, session)
        break
      case "5":
      case "0":
        await this.sessionService.updateSessionMenu(phoneNumber, "main")
        break
      default:
        await this.whatsappService.sendTextMessage(
          phoneNumber,
          "❌ Invalid option. Please select a number from the menu.",
        )
        await this.handleCoursesMenu(phoneNumber, session)
    }
  }

  private async showCurrentModules(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Loading your current modules...")

    const homeData = await this.portalApiService.getHomeData(session.username!, session.authToken!)

    if (!homeData.success) {
      await this.handleApiError(phoneNumber, homeData.error!, homeData.requiresReauth)
      return
    }

    const modules = homeData.data!.registration.modules

    if (modules.length === 0) {
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "📚 *Current Modules*\n\n❌ No modules found for the current period.\n\nReply with *0* to return to courses menu.",
      )
      return
    }

    let modulesList = "📚 *Current Modules*\n\n"
    modules.forEach((module, index) => {
      const vleStatus = module.vle_status ? "🟢" : "🔴"
      modulesList += `${index + 1}. *${module.module_code}${module.module_unit_code}*\n`
      modulesList += `   ${module.module_name}\n`
      modulesList += `   VLE: ${vleStatus} | Evaluable: ${module.is_evaluable === "1" ? "✅" : "❌"}\n\n`
    })

    modulesList += "Reply with *0* to return to courses menu or *00* for main menu."

    await this.whatsappService.sendTextMessage(phoneNumber, modulesList)
  }

  private async showModuleSelection(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Loading modules...")

    const homeData = await this.portalApiService.getHomeData(session.username!, session.authToken!)

    if (!homeData.success) {
      await this.handleApiError(phoneNumber, homeData.error!, homeData.requiresReauth)
      return
    }

    const modules = homeData.data!.registration.modules

    if (modules.length === 0) {
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "📚 *Module Details*\n\n❌ No modules found.\n\nReply with *0* to return to courses menu.",
      )
      return
    }

    let moduleSelection = "📚 *Select a Module for Details*\n\n"
    modules.forEach((module, index) => {
      moduleSelection += `${index + 1}. ${module.module_code}${module.module_unit_code} - ${module.module_name}\n`
    })

    moduleSelection += "\nReply with the module number for details, *0* for courses menu, or *00* for main menu."

    await this.whatsappService.sendTextMessage(phoneNumber, moduleSelection)

    // Store modules in session for reference
    session.tempData = { modules, awaitingModuleSelection: true }
    await this.sessionService.updateSessionMenu(phoneNumber, "courses_module_details")
  }

  private async showPastExamPapers(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Loading past exam papers...")

    const homeData = await this.portalApiService.getHomeData(session.username!, session.authToken!)

    if (!homeData.success) {
      await this.handleApiError(phoneNumber, homeData.error!, homeData.requiresReauth)
      return
    }

    const modules = homeData.data!.registration.modules
    let examPapersList = "📄 *Past Exam Papers*\n\n"
    let hasExamPapers = false

    modules.forEach((module) => {
      if (module.past_exam_papers.length > 0) {
        hasExamPapers = true
        examPapersList += `📚 *${module.module_code}${module.module_unit_code}*\n`

        // Show latest 3 exam papers
        const recentPapers = module.past_exam_papers.slice(0, 3)
        recentPapers.forEach((paper) => {
          examPapersList += `   📄 ${paper.year} - ${paper.description.split(" - ")[1] || "Exam"}\n`
        })
        examPapersList += "\n"
      }
    })

    if (!hasExamPapers) {
      examPapersList += "❌ No past exam papers available.\n\n"
    }

    examPapersList += "Reply with *0* to return to courses menu or *00* for main menu."

    await this.whatsappService.sendTextMessage(phoneNumber, examPapersList)
  }

  private async showCourseMaterials(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Loading course materials...")

    const homeData = await this.portalApiService.getHomeData(session.username!, session.authToken!)

    if (!homeData.success) {
      await this.handleApiError(phoneNumber, homeData.error!, homeData.requiresReauth)
      return
    }

    const modules = homeData.data!.registration.modules
    let materialsList = "📖 *Course Materials*\n\n"
    let hasMaterials = false

    modules.forEach((module) => {
      const totalMaterials = module.reading_materials.length + module.assignments.length + module.course_work.length

      if (totalMaterials > 0) {
        hasMaterials = true
        materialsList += `📚 *${module.module_code}${module.module_unit_code}*\n`
        materialsList += `   📖 Reading Materials: ${module.reading_materials.length}\n`
        materialsList += `   📝 Assignments: ${module.assignments.length}\n`
        materialsList += `   📊 Course Work: ${module.course_work.length}\n\n`
      }
    })

    if (!hasMaterials) {
      materialsList += "❌ No course materials available.\n\n"
    }

    materialsList += "Reply with *0* to return to courses menu or *00* for main menu."

    await this.whatsappService.sendTextMessage(phoneNumber, materialsList)
  }

  async handleModuleDetailsInput(phoneNumber: string, input: string, session: Session): Promise<void> {
    if (input === "0") {
      await this.sessionService.updateSessionMenu(phoneNumber, "courses")
      await this.handleCoursesMenu(phoneNumber, session)
      return
    }

    if (input === "00") {
      await this.sessionService.updateSessionMenu(phoneNumber, "main")
      return
    }

    const moduleIndex = Number.parseInt(input) - 1
    const modules = session.tempData?.modules as Module[]

    if (!modules || isNaN(moduleIndex) || moduleIndex < 0 || moduleIndex >= modules.length) {
      await this.whatsappService.sendTextMessage(phoneNumber, "❌ Invalid module selection. Please try again.")
      return
    }

    const selectedModule = modules[moduleIndex]
    const moduleDetails = `📚 *${selectedModule.module_code}${selectedModule.module_unit_code}*

📖 *Module Name:* ${selectedModule.module_name}
🆔 *Module ID:* ${selectedModule.module_id}
✅ *Evaluable:* ${selectedModule.is_evaluable === "1" ? "Yes" : "No"}
💻 *VLE Status:* ${selectedModule.vle_status ? "🟢 Active" : "🔴 Inactive"}

📊 *Resources Available:*
📄 Past Exam Papers: ${selectedModule.past_exam_papers.length}
📖 Reading Materials: ${selectedModule.reading_materials.length}
📝 Assignments: ${selectedModule.assignments.length}
📊 Course Work: ${selectedModule.course_work.length}
📢 Posts: ${selectedModule.posts.length}

Reply with *0* to return to courses menu or *00* for main menu.`

    await this.whatsappService.sendTextMessage(phoneNumber, moduleDetails)
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
        `❌ *Error*\n\n${error}\n\nReply with *0* to return to courses menu or *00* for main menu.`,
      )
    }
  }
}
