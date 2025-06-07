import axios, { AxiosResponse, AxiosError } from 'axios';
import { AuthResponse, LoginCredentials } from '../models/auth.model';

export class AuthService {
  private baseUrl: string = 'https://elearning.cut.ac.zw';
  private timeout: number = 30000; // 30 seconds timeout

  public async getAuthToken(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log(`Attempting authentication for user: ${credentials.username}`);
      
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/portal/index.php/portal/login/authenticate`,
        new URLSearchParams({
          username: credentials.username,
          password: credentials.password,
          login: credentials.login
        }),
        {
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400,
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'text/html,application/xhtml+xml,application/xml',
            'User-Agent': 'Mozilla/5.0 (compatible; YourAppName/1.0)'
          }
        }
      );

      console.log(`Authentication response status: ${response.status}`);
      
      // Check if we got a redirect (302 status)
      if (response.status === 302 && response.headers.location) {
        const redirectUrl = response.headers.location;
        console.log(`Redirect URL: ${redirectUrl}`);
        
        // Check for failed login - redirect URL contains login?e=1
        if (redirectUrl.includes('login?e=1')) {
          return {
            success: false,
            error: 'Invalid credentials',
            token: null,
            username: null
          };
        }
        
        // Parse the auth token from the URL - successful login case
        try {
          // Format: https://elearning.cut.ac.zw/student/#/auth/USERNAME/TOKEN
          const urlParts = redirectUrl.split('/');
          const username = urlParts[urlParts.length - 2];
          const authToken = urlParts[urlParts.length - 1];
          
          if (!username || !authToken) {
            throw new Error('Failed to extract username or token from redirect URL');
          }
          
          return {
            success: true,
            token: authToken,
            username: username
          };
        } catch (parseError) {
          console.error('Error parsing redirect URL:', parseError, redirectUrl);
          return {
            success: false,
            error: 'Failed to parse authentication response',
            details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
          };
        }
      } else {
        console.warn('Unexpected response format:', response.status, response.headers);
        return {
          success: false,
          error: `Unexpected response format: Status ${response.status}`,
          details: 'No redirect found in response'
        };
      }
    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      let statusCode = 500;
      let errorDetails = {};
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        // Network errors
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ECONNABORTED') {
          errorMessage = 'Could not connect to authentication server';
          statusCode = 503;
          errorDetails = { code: axiosError.code };
        }
        // Timeout errors
        else if (axiosError.code === 'ETIMEDOUT') {
          errorMessage = 'Authentication server request timed out';
          statusCode = 504;
          errorDetails = { timeout: this.timeout };
        }
        // Server errors
        else if (axiosError.response && axiosError.response.status >= 500) {
          errorMessage = 'Authentication server error';
          statusCode = axiosError.response.status;
          errorDetails = { 
            statusText: axiosError.response.statusText,
            data: axiosError.response.data
          };
        }
        // Client errors
        else if (axiosError.response && axiosError.response.status >= 400 && axiosError.response.status < 500) {
          errorMessage = 'Invalid request to authentication server';
          statusCode = axiosError.response.status;
          errorDetails = { 
            statusText: axiosError.response.statusText,
            data: axiosError.response.data
          };
        }
      }
      
      console.error('Authentication error:', {
        message: errorMessage,
        statusCode,
        details: errorDetails,
        error: error instanceof Error ? error.message : 'Non-Error object thrown'
      });
      
      return {
        success: false,
        error: errorMessage,
        statusCode,
        details: errorDetails
      };
    }
  }
}
