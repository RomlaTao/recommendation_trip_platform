import { registerAs } from '@nestjs/config';

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
  verifyTokenTtlSeconds: number;
  verifyBaseUrl: string;
}

export default registerAs(
  'email',
  (): EmailConfig => ({
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT ?? '465', 10),
    user: process.env.MAIL_USER ?? '',
    pass: process.env.MAIL_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'no-reply@localhost',
    secure: (process.env.MAIL_SECURE ?? 'true') === 'true',
    verifyTokenTtlSeconds: parseInt(
      process.env.EMAIL_VERIFY_TOKEN_TTL_SECONDS ?? '900',
      10,
    ),
    verifyBaseUrl:
      process.env.EMAIL_VERIFY_BASE_URL ??
      'http://localhost:3000/example/verify-email',
  }),
);
