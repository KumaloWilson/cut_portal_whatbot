import { Request, Response } from 'express';
import { LoginCredentials } from '../models/auth.model';
import { AuthService } from '../services/auth.service';


export class AuthController {
  private authService: AuthService;
  
  constructor() {
    this.authService = new AuthService();
  }
  
  public async login(req: Request, res: Response): Promise<void> {
    try {
      // Input validation
      if (!req.body) {
        res.status(400).json({ 
          success: false, 
          error: 'Missing request body' 
        });
        return;
      }
      
      const { username, password, login } = req.body;
      
      if (!username || typeof username !== 'string') {
        res.status(400).json({ 
          success: false, 
          error: 'Username is required and must be a string' 
        });
        return;
      }
      
      if (!password || typeof password !== 'string') {
        res.status(400).json({ 
          success: false, 
          error: 'Password is required and must be a string' 
        });
        return;
      }
      
      const credentials: LoginCredentials = {
        username: username.trim(),
        password: password,
        login: login || 'Login' // Default value if not provided
      };
      
      console.log(`Login attempt for user: ${credentials.username}`);
      
      // Set a timeout for the entire request
      const loginTimeout = setTimeout(() => {
        console.error(`Login request timed out for user: ${credentials.username}`);
        if (!res.headersSent) {
          res.status(504).json({
            success: false,
            error: 'Login request timed out',
            retryAfter: 30 // Suggest retry after 30 seconds
          });
        }
      }, 45000); // 45 seconds timeout
      
      const result = await this.authService.getAuthToken(credentials);
      
      // Clear the timeout since we got a response
      clearTimeout(loginTimeout);
      
      if (result.success) {
        res.status(200).json(result);
      } else if (result.error === 'Invalid credentials') {
        res.status(401).json(result);
      } else if (result.statusCode) {
        // Use the status code from the service if available
        res.status(result.statusCode).json(result);
      } else {
        // Default to 500 for unknown errors
        res.status(500).json(result);
      }
      
      console.log(`Login ${result.success ? 'successful' : 'failed'} for user: ${credentials.username}`);
    } catch (error) {
      console.error('Login controller unexpected error:', error);
      
      // Prevent double-sending response
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryAfter: 60 // Suggest retry after 60 seconds
        });
      }
    }
  }
}
