import { WhatsAppService } from "../services/whatsapp.service"
import { PortalApiService } from "../services/portal-api.service"
import { SessionService } from "../services/session.service"
import type { Session } from "../models/session.model"

export class FinancesHandler {
  private whatsappService: WhatsAppService
  private portalApiService: PortalApiService
  private sessionService: SessionService

  constructor() {
    this.whatsappService = new WhatsAppService()
    this.portalApiService = new PortalApiService()
    this.sessionService = new SessionService()
  }

  async handleFinancesMenu(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendMenuMessage(
      phoneNumber,
      "💰 Financial Information",
      "What would you like to view?",
      ["Account Balance", "Recent Transactions", "Payment History", "Outstanding Fees", "🔙 Back to Main Menu"],
    )
  }

  async handleFinancesInput(phoneNumber: string, input: string, session: Session): Promise<void> {
    switch (input) {
      case "1":
        await this.showAccountBalance(phoneNumber, session)
        break
      case "2":
        await this.showRecentTransactions(phoneNumber, session)
        break
      case "3":
        await this.showPaymentHistory(phoneNumber, session)
        break
      case "4":
        await this.showOutstandingFees(phoneNumber, session)
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
        await this.handleFinancesMenu(phoneNumber, session)
    }
  }

  private async showAccountBalance(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Loading your account balance...")

    const homeData = await this.portalApiService.getHomeData(session.username!, session.authToken!)

    if (!homeData.success) {
      await this.handleApiError(phoneNumber, homeData.error!, homeData.requiresReauth)
      return
    }

    const bursary = homeData.data!.bursary
    const bankRate = homeData.data!.bankRate

    // Calculate balance from statements
    let balance = 0
    bursary.statements.forEach((statement) => {
      balance += Number.parseFloat(statement.credit) - Number.parseFloat(statement.debit)
    })

    const balanceInfo = `💰 *Account Balance*

🏦 *Account:* ${bursary.pastel_account}
💵 *Current Balance:* $${balance.toFixed(2)}
📈 *Exchange Rate:* ${bankRate.rate} ZWL/USD

${balance >= 0 ? "✅ Account in good standing" : "⚠️ Outstanding balance"}

Reply with *0* to return to finances menu or *00* for main menu.`

    await this.whatsappService.sendTextMessage(phoneNumber, balanceInfo)
  }

  private async showRecentTransactions(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Loading recent transactions...")

    const homeData = await this.portalApiService.getHomeData(session.username!, session.authToken!)

    if (!homeData.success) {
      await this.handleApiError(phoneNumber, homeData.error!, homeData.requiresReauth)
      return
    }

    const statements = homeData.data!.bursary.statements

    if (statements.length === 0) {
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "💰 *Recent Transactions*\n\n❌ No transactions found.\n\nReply with *0* to return to finances menu.",
      )
      return
    }

    let transactionsList = "💰 *Recent Transactions*\n\n"

    // Show last 5 transactions
    const recentTransactions = statements.slice(0, 5)
    recentTransactions.forEach((transaction, index) => {
      const amount = Number.parseFloat(transaction.credit) > 0 ? `+$${transaction.credit}` : `-$${transaction.debit}`
      const type = Number.parseFloat(transaction.credit) > 0 ? "💚" : "❤️"

      transactionsList += `${type} *${amount}*\n`
      transactionsList += `📅 ${new Date(transaction.transaction_date).toLocaleDateString()}\n`
      transactionsList += `📝 ${transaction.transaction_description}\n`
      transactionsList += `🔗 ${transaction.reference_number}\n\n`
    })

    transactionsList += "Reply with *0* to return to finances menu or *00* for main menu."

    await this.whatsappService.sendTextMessage(phoneNumber, transactionsList)
  }

  private async showPaymentHistory(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Loading payment history...")

    const homeData = await this.portalApiService.getHomeData(session.username!, session.authToken!)

    if (!homeData.success) {
      await this.handleApiError(phoneNumber, homeData.error!, homeData.requiresReauth)
      return
    }

    const statements = homeData.data!.bursary.statements
    const payments = statements.filter((s) => Number.parseFloat(s.credit) > 0)

    if (payments.length === 0) {
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "💰 *Payment History*\n\n❌ No payments found.\n\nReply with *0* to return to finances menu.",
      )
      return
    }

    let paymentsList = "💰 *Payment History*\n\n"
    let totalPaid = 0

    payments.slice(0, 8).forEach((payment) => {
      const amount = Number.parseFloat(payment.credit)
      totalPaid += amount

      paymentsList += `💚 *+$${amount.toFixed(2)}*\n`
      paymentsList += `📅 ${new Date(payment.transaction_date).toLocaleDateString()}\n`
      paymentsList += `📝 ${payment.transaction_description}\n\n`
    })

    paymentsList += `💵 *Total Payments:* $${totalPaid.toFixed(2)}\n\n`
    paymentsList += "Reply with *0* to return to finances menu or *00* for main menu."

    await this.whatsappService.sendTextMessage(phoneNumber, paymentsList)
  }

  private async showOutstandingFees(phoneNumber: string, session: Session): Promise<void> {
    await this.whatsappService.sendTextMessage(phoneNumber, "🔄 Loading outstanding fees...")

    const homeData = await this.portalApiService.getHomeData(session.username!, session.authToken!)

    if (!homeData.success) {
      await this.handleApiError(phoneNumber, homeData.error!, homeData.requiresReauth)
      return
    }

    const statements = homeData.data!.bursary.statements
    const debits = statements.filter((s) => Number.parseFloat(s.debit) > 0)

    if (debits.length === 0) {
      await this.whatsappService.sendTextMessage(
        phoneNumber,
        "💰 *Outstanding Fees*\n\n✅ No outstanding fees found.\n\nReply with *0* to return to finances menu.",
      )
      return
    }

    let feesList = "💰 *Outstanding Fees*\n\n"
    let totalOwed = 0

    debits.forEach((fee) => {
      const amount = Number.parseFloat(fee.debit)
      totalOwed += amount

      feesList += `❤️ *$${amount.toFixed(2)}*\n`
      feesList += `📅 ${new Date(fee.transaction_date).toLocaleDateString()}\n`
      feesList += `📝 ${fee.transaction_description}\n\n`
    })

    feesList += `💸 *Total Outstanding:* $${totalOwed.toFixed(2)}\n\n`
    feesList += "Reply with *0* to return to finances menu or *00* for main menu."

    await this.whatsappService.sendTextMessage(phoneNumber, feesList)
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
        `❌ *Error*\n\n${error}\n\nReply with *0* to return to finances menu or *00* for main menu.`,
      )
    }
  }
}
