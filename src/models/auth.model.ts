export interface LoginCredentials {
  username: string;
  password: string;
  login: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string | null;
  username?: string | null;
  error?: string;
  statusCode?: number;
  details?: any;
  retryAfter?: number; 
}
