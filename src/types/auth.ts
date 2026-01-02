// Authentication-related types for Supabase auth implementation

export type UserRole = 'parent' | 'instructor' | 'admin' | 'coordinator';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface UserWithRole extends Profile {
  role: UserRole;
  roles: UserRoleRecord[];
}

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  emailConfirmed: boolean;
  createdAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  redirectTo?: string | null;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  phone?: string;
  confirm_password: string;
  terms_accepted: boolean;
  redirect_url?: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirm {
  token: string;
  password: string;
  confirm_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface OAuthProvider {
  id: string;
  name: string;
  icon: string;
  url: string;
}

export interface TwoFactorSetup {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

export interface TwoFactorVerification {
  code: string;
}

export interface AuthError {
  type: 'validation' | 'authentication' | 'authorization' | 'server';
  message: string;
  field?: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

// Auth context types
export interface AuthContextType extends AuthState {
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: RegisterCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  resetPassword: (request: ResetPasswordRequest) => Promise<{ success: boolean; message: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; message: string }>;
  signInWithGoogle: () => Promise<void>;
}

// Route protection types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireSubscription?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}