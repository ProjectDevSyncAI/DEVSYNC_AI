export interface AuthenticatedUser {
  userId: string;
  id: string;
  email: string;
  username: string;
  platformRole?: string;
  tokenVersion?: number;
  roles?: string[];
  emailVerifiedAt?: Date | null;
}
