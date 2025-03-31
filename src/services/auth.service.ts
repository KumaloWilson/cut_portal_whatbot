import axios, { AxiosResponse } from 'axios';
import { AuthResponse, LoginCredentials } from '../models/auth.model';

export class AuthService {
  private baseUrl: string = 'https://elearning.cut.ac.zw';

  public async getAuthToken(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/portal/index.php/portal/login/authenticate`,
        new URLSearchParams({
          username: credentials.username,
          password: credentials.password,
          login: credentials.login
        }),
        {
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400
        }
      );

      // Check if we got a redirect (302 status)
      if (response.status === 302 && response.headers.location) {
        const redirectUrl = response.headers.location;
        
        // Parse the auth token from the URL
        // Format: https://elearning.cut.ac.zw/student/#/auth/USERNAME/TOKEN
        const urlParts = redirectUrl.split('/');
        const username = urlParts[urlParts.length - 2];
        const authToken = urlParts[urlParts.length - 1];
        
        return {
          success: true,
          token: authToken,
          username: username
        };
      }
      
      return {
        success: false,
        error: 'No redirect found in response'
      };
    } catch (error) {
      console.error('Error getting auth token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}