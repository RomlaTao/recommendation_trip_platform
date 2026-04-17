export interface SendVerifyEmailJobPayload {
  to: string;
  username?: string;
  verifyToken: string;
}
