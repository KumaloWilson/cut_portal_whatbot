import axios, { type AxiosResponse } from "axios"
import type {
  HomeDataResponse,
  WiFiStatusResponse,
  WiFiActivationResponse,
  ResultPeriodsResponse,
  StudentResultsResponse,
} from "../models/portal-api.model"

export class PortalApiService {
  private baseUrl = "https://elearning.cut.ac.zw/portal/index.php/cut_elearning"
  private timeout = 30000

  async getHomeData(regNumber: string, token: string): Promise<HomeDataResponse> {
    try {
      console.log(`Fetching home data for user: ${regNumber}`)

      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/api/getHomeData/${regNumber}/${token}`,
        {
          reg_number: regNumber,
          token: token,
        },
        {
          timeout: this.timeout,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "CUT-WhatsApp-Bot/1.0",
          },
        },
      )

      // Handle HTML response and convert to JSON if needed
      let responseData = response.data

      // If response is HTML, try to extract JSON
      if (typeof responseData === "string" && responseData.includes("<html>")) {
        console.warn("Received HTML response, attempting to extract JSON")
        // Try to find JSON in the HTML response
        const jsonMatch = responseData.match(/\{.*\}/s)
        if (jsonMatch) {
          responseData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error("Could not extract JSON from HTML response")
        }
      }

      if (responseData.valid) {
        return {
          success: true,
          data: responseData.body,
        }
      } else {
        return {
          success: false,
          error: responseData.message || "Invalid response from portal",
        }
      }
    } catch (error) {
      console.error("Portal API error:", error)

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          return {
            success: false,
            error: "Authentication failed. Please login again.",
            requiresReauth: true,
          }
        }

        if (error.response && error.response.status && error.response.status >= 500) {
          return {
            success: false,
            error: "Portal server error. Please try again later.",
          }
        }
      }

      return {
        success: false,
        error: "Failed to fetch data from portal. Please try again.",
      }
    }
  }

  async getWiFiStatus(regNumber: string, token: string): Promise<WiFiStatusResponse> {
    try {
      console.log(`Fetching WiFi status for user: ${regNumber}`)

      const response: AxiosResponse = await axios.get(`${this.baseUrl}/api/getMyWifi/${regNumber}/${token}`, {
        timeout: this.timeout,
        headers: {
          Accept: "application/json",
          "User-Agent": "CUT-WhatsApp-Bot/1.0",
        },
      })

      let responseData = response.data

      // Handle HTML response and convert to JSON if needed
      if (typeof responseData === "string" && responseData.includes("<html>")) {
        console.warn("Received HTML response, attempting to extract JSON")
        const jsonMatch = responseData.match(/\{.*\}/s)
        if (jsonMatch) {
          responseData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error("Could not extract JSON from HTML response")
        }
      }

      if (responseData.valid) {
        return {
          success: true,
          data: {
            isActive: responseData.body !== null,
            message: responseData.message,
          },
        }
      } else {
        return {
          success: false,
          error: responseData.message || "Invalid response from portal",
        }
      }
    } catch (error) {
      console.error("WiFi status API error:", error)
      return this.handleApiError(error)
    }
  }

  async activateWiFi(regNumber: string, token: string): Promise<WiFiActivationResponse> {
    try {
      console.log(`Activating WiFi for user: ${regNumber}`)

      const response: AxiosResponse = await axios.get(`${this.baseUrl}/api/changeWifi/${regNumber}/${token}`, {
        timeout: this.timeout,
        headers: {
          Accept: "application/json",
          "User-Agent": "CUT-WhatsApp-Bot/1.0",
        },
      })

      let responseData = response.data

      // Handle HTML response and convert to JSON if needed
      if (typeof responseData === "string" && responseData.includes("<html>")) {
        console.warn("Received HTML response, attempting to extract JSON")
        const jsonMatch = responseData.match(/\{.*\}/s)
        if (jsonMatch) {
          responseData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error("Could not extract JSON from HTML response")
        }
      }

      if (responseData.valid && responseData.body) {
        return {
          success: true,
          data: responseData.body,
        }
      } else {
        return {
          success: false,
          error: responseData.message || "WiFi activation failed",
        }
      }
    } catch (error) {
      console.error("WiFi activation API error:", error)
      return this.handleApiError(error)
    }
  }

  async getResultPeriods(regNumber: string, token: string): Promise<ResultPeriodsResponse> {
    try {
      console.log(`Fetching result periods for user: ${regNumber}`)

      const response: AxiosResponse = await axios.get(`${this.baseUrl}/api/getResultPeriods/${regNumber}/${token}`, {
        timeout: this.timeout,
        headers: {
          Accept: "application/json",
          "User-Agent": "CUT-WhatsApp-Bot/1.0",
        },
      })

      let responseData = response.data

      // Handle HTML response and convert to JSON if needed
      if (typeof responseData === "string" && responseData.includes("<html>")) {
        console.warn("Received HTML response, attempting to extract JSON")
        const jsonMatch = responseData.match(/\{.*\}/s)
        if (jsonMatch) {
          responseData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error("Could not extract JSON from HTML response")
        }
      }

      if (responseData.valid) {
        return {
          success: true,
          data: responseData.body,
        }
      } else {
        return {
          success: false,
          error: responseData.message || "Failed to fetch result periods",
        }
      }
    } catch (error) {
      console.error("Result periods API error:", error)
      return this.handleApiError(error)
    }
  }

  async getStudentResults(regNumber: string, token: string, periodId: string): Promise<StudentResultsResponse> {
    try {
      console.log(`Fetching results for user: ${regNumber}, period: ${periodId}`)

      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/api/getMyResults/${regNumber}/${token}?p=${periodId}`,
        {
          timeout: this.timeout,
          headers: {
            Accept: "application/json",
            "User-Agent": "CUT-WhatsApp-Bot/1.0",
          },
        },
      )

      let responseData = response.data

      // Handle HTML response and convert to JSON if needed
      if (typeof responseData === "string" && responseData.includes("<html>")) {
        console.warn("Received HTML response, attempting to extract JSON")
        const jsonMatch = responseData.match(/\{.*\}/s)
        if (jsonMatch) {
          responseData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error("Could not extract JSON from HTML response")
        }
      }

      // Check for balance error response
      if (responseData.valid && responseData.body && responseData.body.error && responseData.body.message) {
        // Extract balance amount from message
        const balanceMatch = responseData.body.message.match(/current balance is\s*([\d.]+)/i)
        const currentBalance = balanceMatch ? Number.parseFloat(balanceMatch[1]) : 0

        return {
          success: false,
          error: "Insufficient balance to view results",
          balanceError: {
            valid: responseData.body.valid,
            message: responseData.body.message,
            error: responseData.body.error,
            currentBalance: Math.abs(currentBalance), // Make it positive for display
          },
        }
      }

      // Normal results response
      if (responseData && responseData.periodname) {
        return {
          success: true,
          data: responseData,
        }
      } else {
        return {
          success: false,
          error: "Failed to fetch results or invalid response format",
        }
      }
    } catch (error) {
      console.error("Student results API error:", error)
      return this.handleApiError(error)
    }
  }

  private handleApiError(error: any): any {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return {
          success: false,
          error: "Authentication failed. Please login again.",
          requiresReauth: true,
        }
      }

      if (error.response && error.response.status && error.response.status >= 500) {
        return {
          success: false,
          error: "Portal server error. Please try again later.",
        }
      }
    }

    return {
      success: false,
      error: "Failed to communicate with portal. Please try again.",
    }
  }
}
