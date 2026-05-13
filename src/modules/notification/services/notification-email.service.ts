import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { EmailConfig } from '../../../core/config/email.config.js';
import {
  PlaceApprovedNotificationPayload,
  PlaceRequestSubmittedNotificationPayload,
  PlaceRejectedNotificationPayload,
  VerifyEmailNotificationPayload,
} from '../notification.types.js';

@Injectable()
export class NotificationEmailService {
  private readonly emailConfig: EmailConfig;
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.emailConfig = this.configService.get<EmailConfig>('email')!;
    this.transporter = createTransport({
      host: this.emailConfig.host,
      port: this.emailConfig.port,
      secure: this.emailConfig.secure,
      auth: {
        user: this.emailConfig.user,
        pass: this.emailConfig.pass,
      },
    });
  }

  async sendVerifyEmail(
    payload: VerifyEmailNotificationPayload,
  ): Promise<void> {
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

  async sendPlaceApprovedEmail(
    payload: PlaceApprovedNotificationPayload,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.emailConfig.from,
      to: payload.to,
      subject: 'Place approved',
      text: `Your place (${payload.placeId}) has been approved and is now visible on catalog.`,
      html: `
        <div>
          <p>Your place has been approved.</p>
          <p><strong>Place ID:</strong> ${payload.placeId}</p>
          <p>It is now visible on catalog.</p>
        </div>
      `,
    });
  }

  async sendPlaceRejectedEmail(
    payload: PlaceRejectedNotificationPayload,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.emailConfig.from,
      to: payload.to,
      subject: 'Place rejected',
      text: `Your place (${payload.placeId}) was rejected. Reason: ${payload.reason}`,
      html: `
        <div>
          <p>Your place was rejected.</p>
          <p><strong>Place ID:</strong> ${payload.placeId}</p>
          <p><strong>Reason:</strong> ${payload.reason}</p>
        </div>
      `,
    });
  }

  async sendPlaceRequestSubmittedEmail(
    payload: PlaceRequestSubmittedNotificationPayload,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.emailConfig.from,
      to: payload.to,
      subject: 'New place request submitted',
      text: `A new place request has been submitted. Request ID: ${payload.requestId}. Place name: ${payload.placeName}.`,
      html: `
        <div>
          <p>A new place request has been submitted.</p>
          <p><strong>Request ID:</strong> ${payload.requestId}</p>
          <p><strong>Place name:</strong> ${payload.placeName}</p>
          <p><strong>Requester user ID:</strong> ${payload.requesterUserId}</p>
        </div>
      `,
    });
  }
}
