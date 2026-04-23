import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailConfig } from '../../../core/config/email.config.js';
import { VerifyEmailNotificationPayload } from '../notification.types.js';

@Injectable()
export class NotificationEmailService {
  private readonly emailConfig: EmailConfig;
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.emailConfig = this.configService.get<EmailConfig>('email')!;
    this.transporter = nodemailer.createTransport({
      host: this.emailConfig.host,
      port: this.emailConfig.port,
      secure: this.emailConfig.secure,
      auth: {
        user: this.emailConfig.user,
        pass: this.emailConfig.pass,
      },
    });
  }

  async sendVerifyEmail(payload: VerifyEmailNotificationPayload): Promise<void> {
    const verifyUrl = `${this.emailConfig.verifyBaseUrl}?token=${encodeURIComponent(payload.verifyToken)}`;
    const displayName = payload.username?.trim() || 'there';

    await this.transporter.sendMail({
      from: this.emailConfig.from,
      to: payload.to,
      subject: 'Verify your email',
      text: `Hi ${displayName}, verify your account by visiting this link: ${verifyUrl}`,
      html: `
        <div>
          <p>Hi ${displayName},</p>
          <p>Please verify your account by clicking the link below:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
  }
}
