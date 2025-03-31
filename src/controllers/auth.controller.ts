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
      const credentials: LoginCredentials = {
        username: req.body.username,
        password: req.body.password,
        login: req.body.login || 'Login' // Default value if not provided
      };
      
      // Validate request
      if (!credentials.username || !credentials.password) {
        res.status(400).json({ success: false, error: 'Username and password are required' });
        return;
      }
      
      const result = await this.authService.getAuthToken(credentials);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      console.error('Login controller error:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  }
}
