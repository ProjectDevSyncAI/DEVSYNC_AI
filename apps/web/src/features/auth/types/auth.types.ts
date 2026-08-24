export type AuthMode = "login" | "register";

export type UserRole =
  | "admin"
  | "manager"
  | "developer"
  | "designer"
  | "member";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  organizationId?: string;
  organizationName?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationName?: string;
  role?: UserRole;
  acceptTerms: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface PasswordValidation {
  length: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
  score: number;
  label: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt?: string;
}