export interface LoginCredentials {
  username: string;
  password: string;
  login: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  username?: string;
  error?: string;
}