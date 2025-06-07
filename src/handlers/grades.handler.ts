import { WhatsAppService } from "../services/whatsapp.service"
import { PortalApiService } from "../services/portal-api.service"
import { SessionService } from "../services/session.service"
import type { Session } from "../models/session.model"
import type { ModuleResult, ResultPeriod, BalanceError } from "../models/portal-api.model"

export class GradesHandler {
  private whatsappService: WhatsAppService
  private portalApiService: PortalApiService
  private sessionService: SessionService

  constructor() {
    this.whatsappService = new WhatsAppService()
    this.portalApiService = new PortalApiService()
    this.sessionService = new SessionService()
  }

  async handleGradesMenu(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Loading available academic periods...")

    try {
      const periodsResponse = await this.portalApiService.getResultPeriods(session.username!, session.authToken!)

      if (!periodsResponse.success) {
        await this.handleApiError(phoneNumber, periodsResponse.error!, periodsResponse.requiresReauth)
        return
      }

      const periods = periodsResponse.data || []

      if (periods.length === 0) {
        await this.whatsappService.sendTextMessage(
          phoneNumber,
          "📊 *Academic Results*\n\n❌ No academic periods found with available results.\n\nReply with *0* to return to the main menu.",
        )
        return
      }

      let periodsMenu = "📊 *Academic Results*\n\nSelect a period to view your results:\n\n"

      periods.forEach((period, index) => {
        periodsMenu += `${index + 1}. ${period.period_name}\n`
      })

      periodsMenu += "\nReply with the number of the period or *0* to return to the main menu."

      await this.whatsappService.sendTextMessage(phoneNumber, periodsMenu)

      // Store periods in session for reference
      session.tempData = { periods }
      await this.sessionService.updateSessionMenu(phoneNumber, "grades_period_selection")
    } catch (error) {
      console.error("Error fetching academic periods:", error)
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "❌ *Error*\n\nFailed to load academic periods. Please try again later.\n\nReply with *0* to return to the main menu.",
      )
    }
  }

  async handlePeriodSelection(phoneNumber: string, input: string, session: Session): Promise<void> {
    if (input === "0") {
      await this.sessionService.updateSessionMenu(phoneNumber, "main")
      return
    }

    const periodIndex = Number.parseInt(input) - 1
    const periods = session.tempData?.periods as ResultPeriod[]

    if (!periods || isNaN(periodIndex) || periodIndex < 0 || periodIndex >= periods.length) {
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "❌ Invalid selection. Please select a valid period number or *0* to return to the main menu.",
      )
      return
    }

    const selectedPeriod = periods[periodIndex]
    await this.showResultsForPeriod(phoneNumber, session, selectedPeriod)
  }

  private async showResultsForPeriod(phoneNumber: string, session: Session, period: ResultPeriod): Promise<void> {
    await this.whatsappService.sendTextMessage(phoneNumber, `🔄 Loading your results for ${period.period_name}...`)

    try {
      const resultsResponse = await this.portalApiService.getStudentResults(
        session.username!,
        session.authToken!,
        period.period_id,
      )

      if (!resultsResponse.success) {
        // Check if it's a balance error
        if (resultsResponse.balanceError) {
          await this.handleBalanceError(phoneNumber, session, resultsResponse.balanceError, period)
          return
        }

        await this.handleApiError(phoneNumber, resultsResponse.error!, resultsResponse.requiresReauth)
        return
      }

      const results = resultsResponse.data!
      const modules = results.modules || []

      if (modules.length === 0) {
        await this.whatsappService.sendTextMessage(
          phoneNumber,
          `📊 *Results: ${period.period_name}*\n\n❌ No results available for this period.\n\nReply with *0* to return to periods list or *00* for main menu.`,
        )

        // Update session to handle the "0" response correctly
        session.tempData = { ...session.tempData, viewingEmptyResults: true }
        return
      }

      // Calculate GPA and total credits
      let totalPoints = 0
      let totalCredits = 0
      let passedCredits = 0

      modules.forEach((module) => {
        const credits = module.credits || 0
        totalCredits += credits

        // Check if passed (assuming pass is score >= 50)
        if (module.score >= 50) {
          passedCredits += credits
          totalPoints += module.score * credits
        }
      })

      const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "N/A"
      const passRate = totalCredits > 0 ? Math.round((passedCredits / totalCredits) * 100) : 0

      // Format results message
      let resultsMessage = `📊 *Results: ${period.period_name}*\n\n`

      // Add summary
      resultsMessage += `📈 *Summary:*\n`
      resultsMessage += `GPA: ${gpa}\n`
      resultsMessage += `Credits Attempted: ${totalCredits}\n`
      resultsMessage += `Credits Passed: ${passedCredits}\n`
      resultsMessage += `Pass Rate: ${passRate}%\n\n`

      // Add module results
      resultsMessage += `📚 *Module Results:*\n\n`

      modules.forEach((module, index) => {
        const passStatus = module.score >= 50 ? "✅" : "❌"
        resultsMessage += `${index + 1}. ${module.module_code}: ${module.module_name}\n`
        resultsMessage += `   Score: ${module.score}% ${passStatus}\n`
        resultsMessage += `   Credits: ${module.credits}\n`
        if (module.comment) {
          resultsMessage += `   Note: ${module.comment}\n`
        }
        resultsMessage += `\n`
      })

      resultsMessage += `Reply with a module number for details, *0* to return to periods list, or *00* for main menu.`

      await this.whatsappService.sendTextMessage(phoneNumber, resultsMessage)

      // Store results in session for reference
      session.tempData = { ...session.tempData, currentPeriod: period, modules }
      await this.sessionService.updateSessionMenu(phoneNumber, "grades_module_selection")
    } catch (error) {
      console.error("Error fetching results:", error)
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "❌ *Error*\n\nFailed to load results. Please try again later.\n\nReply with *0* to return to periods list or *00* for main menu.",
      )
    }
  }

  private async handleBalanceError(
    phoneNumber: string,
    session: Session,
    balanceError: BalanceError,
    period: ResultPeriod,
  ): Promise<void> {
    const balanceMessage = `💰 *Outstanding Balance*

❌ You cannot view your results for *${period.period_name}* due to an outstanding balance.

💸 *Current Outstanding Balance:* $${balanceError.currentBalance.toFixed(2)}

📋 *What you can do:*
1️⃣ Make a payment to clear your balance
2️⃣ Contact the Finance Office for payment arrangements
3️⃣ Check your financial statement for details

💳 *Payment Options:*
• Online banking
• Bank deposit
• Mobile money
• Visit Finance Office

📞 *Finance Office Contact:*
📧 Email: finance@cut.ac.zw
📱 Phone: +263-4-123456
🏢 Location: Admin Building, Room 201
🕒 Hours: Mon-Fri, 8:00 AM - 4:30 PM

💡 *Quick Actions:*
Reply *1* to view your financial statement
Reply *2* to get payment instructions
Reply *0* to return to periods list
Reply *00* for main menu`

    await this.whatsappService.sendTextMessage(phoneNumber, balanceMessage)

    // Store balance error info in session for quick actions
    session.tempData = {
      ...session.tempData,
      balanceError,
      selectedPeriod: period,
    }
    await this.sessionService.updateSessionMenu(phoneNumber, "grades_balance_error")
  }

  async handleBalanceErrorActions(phoneNumber: string, input: string, session: Session): Promise<void> {
    switch (input) {
      case "1":
        await this.showFinancialStatement(phoneNumber, session)
        break
      case "2":
        await this.showPaymentInstructions(phoneNumber)
        break
      case "0":
        await this.sessionService.updateSessionMenu(phoneNumber, "grades")
        await this.handleGradesMenu(phoneNumber, session)
        break
      case "00":
        await this.sessionService.updateSessionMenu(phoneNumber, "main")
        break
      default:
        await this.whatsappService.sendTextMessage(phoneNumber, "❌ Invalid option. Please select 1, 2, 0, or 00.")
    }
  }

  private async showFinancialStatement(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Loading your financial statement...")

    try {
      // Get financial data from home API
      const homeData = await this.portalApiService.getHomeData(session.username!, session.authToken!)

      if (!homeData.success) {
        await this.whatsappService.sendTextMessage(
          phoneNumber,
          "❌ Failed to load financial statement. Please try again later.\n\nReply with *0* to return to periods list.",
        )
        return
      }

      const bursary = homeData.data!.bursary
      const statements = bursary.statements.slice(0, 5) // Show last 5 transactions

      let statementMessage = `💰 *Financial Statement*\n\n🏦 *Account:* ${bursary.pastel_account}\n\n📊 *Recent Transactions:*\n\n`

      statements.forEach((statement, index) => {
        const amount = Number.parseFloat(statement.credit) > 0 ? `+$${statement.credit}` : `-$${statement.debit}`
        const type = Number.parseFloat(statement.credit) > 0 ? "💚" : "❤️"

        statementMessage += `${type} *${amount}*\n`
        statementMessage += `📅 ${new Date(statement.transaction_date).toLocaleDateString()}\n`
        statementMessage += `📝 ${statement.transaction_description}\n\n`
      })

      statementMessage += `💡 *To clear your balance and access results:*\nMake a payment to cover the outstanding amount.\n\nReply with *2* for payment instructions\nReply with *0* to return to periods list\nReply with *00* for main menu`

      await this.whatsappService.sendTextMessage(phoneNumber, statementMessage)
    } catch (error) {
      console.error("Error fetching financial statement:", error)
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "❌ Failed to load financial statement. Please try again later.\n\nReply with *0* to return to periods list.",
      )
    }
  }

  private async showPaymentInstructions(phoneNumber: string): Promise<void> {
    const paymentMessage = `💳 *Payment Instructions*

🏦 *Bank Details:*
Bank: Standard Chartered Bank
Account Name: Chinhoyi University of Technology
Account Number: 0123456789
Branch: Chinhoyi Branch
Swift Code: STANCTZW

📱 *Mobile Money:*
EcoCash: *151*2*2*0123456789*AMOUNT#
OneMoney: *111*2*2*0123456789*AMOUNT#

💻 *Online Banking:*
Use your bank's online platform
Reference: Your Student ID

🏢 *In-Person Payment:*
Visit any Standard Chartered branch
Mention: CUT Student Payment
Bring: Student ID and payment slip

⚠️ *Important Notes:*
• Include your Student ID in payment reference
• Keep payment receipt for records
• Payments may take 24-48 hours to reflect
• Contact Finance Office if payment doesn't reflect

📞 *Need Help?*
Finance Office: +263-4-123456
Email: finance@cut.ac.zw

Reply with *1* to view financial statement
Reply with *0* to return to periods list
Reply with *00* for main menu`

    await this.whatsappService.sendTextMessage(phoneNumber, paymentMessage)
  }

  async handleModuleSelection(phoneNumber: string, input: string, session: Session): Promise<void> {
    if (input === "0") {
      await this.sessionService.updateSessionMenu(phoneNumber, "grades")
      await this.handleGradesMenu(phoneNumber, session)
      return
    }

    if (input === "00") {
      await this.sessionService.updateSessionMenu(phoneNumber, "main")
      return
    }

    const moduleIndex = Number.parseInt(input) - 1
    const modules = session.tempData?.modules as ModuleResult[]

    if (!modules || isNaN(moduleIndex) || moduleIndex < 0 || moduleIndex >= modules.length) {
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "❌ Invalid selection. Please select a valid module number, *0* for periods list, or *00* for main menu.",
      )
      return
    }

    const selectedModule = modules[moduleIndex]
    await this.showModuleDetails(phoneNumber, session, selectedModule)
  }

  private async showModuleDetails(phoneNumber: string, session: Session, module: ModuleResult): Promise<void> {
    const passStatus = module.score >= 50 ? "✅ PASSED" : "❌ FAILED"
    const gradeEmoji = this.getGradeEmoji(module.score)

    const moduleDetails = `📚 *Module Details*

*${module.module_code}:* ${module.module_name}

📊 *Performance:*
Score: ${module.score}% ${gradeEmoji}
Status: ${passStatus}
Credits: ${module.credits}
${module.comment ? `Note: ${module.comment}` : ""}

${this.getGradeComment(module.score)}

Reply with *0* to return to results list or *00* for main menu.`

    await this.whatsappService.sendTextMessage(phoneNumber, moduleDetails)
  }

  private getGradeEmoji(score: number): string {
    if (score >= 80) return "🏆"
    if (score >= 70) return "🥇"
    if (score >= 60) return "🥈"
    if (score >= 50) return "🥉"
    return "📉"
  }

  private getGradeComment(score: number): string {
    if (score >= 80) return "🌟 *Excellent performance!* You've demonstrated outstanding mastery of this subject."
    if (score >= 70) return "👏 *Great job!* You've shown strong understanding of the material."
    if (score >= 60) return "👍 *Good work!* You've demonstrated solid knowledge of the subject."
    if (score >= 50) return "✅ *Satisfactory!* You've met the requirements to pass this module."
    return "💪 *Keep working!* With more effort, you can improve your performance next time."
  }

  async handleEmptyResultsNavigation(phoneNumber: string, input: string, session: Session): Promise<void> {
    if (input === "0") {
      await this.sessionService.updateSessionMenu(phoneNumber, "grades")
      await this.handleGradesMenu(phoneNumber, session)
      return
    }

    if (input === "00") {
      await this.sessionService.updateSessionMenu(phoneNumber, "main")
      return
    }

    await this.whatsappService.sendTextMessage(
      phoneNumber,
      "❌ Invalid option. Reply with *0* to return to periods list or *00* for main menu.",
    )
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
        `❌ *Error*\n\n${error}\n\nReply with *0* to return to the main menu.`,
      )
    }
  }
}
