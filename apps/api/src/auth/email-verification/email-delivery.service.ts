
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

export type VerificationPurpose =
  | 'INITIAL_VERIFICATION'
  | 'EMAIL_CHANGE';

export type DeliveryStatus =
  | 'CONSTRUCTED'
  | 'ENQUEUED'
  | 'ACCEPTED'
  | 'CONFIRMED'
  | 'SIMULATED'
  | 'FAILED';

export interface SendVerificationEmailParams {
  to: string;
  rawToken: string;
  purpose: VerificationPurpose;
  username?: string;
}

export interface SentEmailRecord {
  to: string;
  purpose: VerificationPurpose;
  verificationUrl: string;
  messageId: string;
  status: DeliveryStatus;
  provider: string;
  sentAt: Date;
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId: string;
  status: DeliveryStatus;
  provider: string;
}

export interface EmailProviderAdapter {
  readonly name: string;
  readonly isProduction: boolean;

  send(params: {
    to: string;
    verificationUrl: string;
    purpose: VerificationPurpose;
    username?: string;
  }): Promise<{
    success: boolean;
    messageId: string;
    status: DeliveryStatus;
  }>;
}

export class InMemoryTestEmailAdapter
  implements EmailProviderAdapter
{
  readonly name = 'in-memory-test';
  readonly isProduction = false;

  async send(): Promise<{
    success: boolean;
    messageId: string;
    status: DeliveryStatus;
  }> {
    return {
      success: true,
      messageId: `test-${Date.now()}`,
      status: 'SIMULATED',
    };
  }
}

export class SmtpEmailAdapter implements EmailProviderAdapter {
  readonly name = 'smtp';
  readonly isProduction = true;

  private readonly transporter: Transporter;

  constructor(
    host: string,
    port: number,
    secure: boolean,
    username: string,
    password: string,
    private readonly from: string,
  ) {
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: username,
        pass: password,
      },
    });
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };

      return entities[char];
    });
  }

  async send(params: {
    to: string;
    verificationUrl: string;
    purpose: VerificationPurpose;
    username?: string;
  }): Promise<{
    success: boolean;
    messageId: string;
    status: DeliveryStatus;
  }> {
    const isEmailChange = params.purpose === 'EMAIL_CHANGE';

    const subject = isEmailChange
      ? 'Confirm your DevSync AI email address'
      : 'Verify your DevSync AI account';

    const heading = isEmailChange
      ? 'Confirm your new email address'
      : 'Verify your email address';

    const greeting = params.username
      ? `Hello ${this.escapeHtml(params.username)},`
      : 'Hello,';

    const buttonText = isEmailChange
      ? 'Confirm Email Change'
      : 'Verify Email Address';

    const text = [
      greeting,
      '',
      heading,
      '',
      'Please open the following link to continue:',
      params.verificationUrl,
      '',
      'If you did not request this, you can ignore this email.',
      '',
      'DevSync AI Team',
    ].join('\n');

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:24px;background:#f4f6fa;font-family:Arial,sans-serif;">
          <div style="max-width:560px;margin:auto;background:#ffffff;padding:32px;border-radius:12px;">
            <h2 style="color:#172554;">DevSync AI</h2>
            <p>${greeting}</p>
            <h3>${heading}</h3>
            <p>
              Please click the button below to complete your
              ${isEmailChange ? 'email change' : 'account verification'}.
            </p>
            <p style="margin:28px 0;">
              <a
                href="${this.escapeHtml(params.verificationUrl)}"
                style="background:#2563eb;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:7px;display:inline-block;"
              >
                ${buttonText}
              </a>
            </p>
            <p style="font-size:13px;color:#64748b;">
              If the button does not work, copy this link into your browser:
            </p>
            <p style="font-size:12px;word-break:break-all;color:#475569;">
              ${this.escapeHtml(params.verificationUrl)}
            </p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:25px 0;" />
            <p style="font-size:12px;color:#64748b;">
              If you did not request this email, you can safely ignore it.
            </p>
            <p style="font-size:12px;color:#64748b;">DevSync AI Team</p>
          </div>
        </body>
      </html>
    `;

    const info = await this.transporter.sendMail({
      from: this.from,
      to: params.to,
      subject,
      text,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
      status: 'ACCEPTED',
    };
  }
}

@Injectable()
export class EmailDeliveryService {
  private readonly logger = new Logger(EmailDeliveryService.name);
  private readonly sentEmails: SentEmailRecord[] = [];
  private adapter: EmailProviderAdapter;


constructor(private readonly configService: ConfigService) {
  const host = this.configService.get<string>('SMTP_HOST')?.trim();
  const portValue = this.configService.get<string>('SMTP_PORT')?.trim();
  const secureValue = this.configService.get<string>('SMTP_SECURE')?.trim();
  const username = this.configService.get<string>('SMTP_USER')?.trim();
  const password = this.configService.get<string>('SMTP_PASS');
  const from = this.configService.get<string>('EMAIL_FROM')?.trim();

  const port = portValue ? Number(portValue) : 587;
  const secure = secureValue?.toLowerCase() === 'true';

  const missing: string[] = [];

  if (!host) missing.push('SMTP_HOST');
  if (!username) missing.push('SMTP_USER');
  if (!password) missing.push('SMTP_PASS');
  if (!from) missing.push('EMAIL_FROM');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    missing.push('SMTP_PORT');
  }

  if (missing.length === 0) {
    this.adapter = new SmtpEmailAdapter(
      host!,
      port,
      secure,
      username!,
      password!,
      from!,
    );

    this.logger.log(
      `SMTP provider configured successfully (${host}:${port}).`,
    );
  } else {
    this.adapter = new InMemoryTestEmailAdapter();

    this.logger.error(
      `SMTP configuration incomplete. Missing or invalid: ${missing.join(', ')}`,
    );

    this.logger.warn(
      'Email delivery is currently simulated. No real email will be sent.',
    );
  }
}


  setAdapter(adapter: EmailProviderAdapter): void {
    this.adapter = adapter;
  }

  isProductionProviderConfigured(): boolean {
    return this.adapter.isProduction;
  }

  getActiveProviderName(): string {
    return this.adapter.name;
  }

  maskEmail(email: string): string {
    const [local, domain] = email.split('@');

    if (!domain || !local) return '***';

    const maskedLocal =
      local.length <= 2
        ? `${local[0]}***`
        : `${local[0]}***${local[local.length - 1]}`;

    return `${maskedLocal}@${domain}`;
  }

  buildVerificationUrl(
    rawToken: string,
    purpose: VerificationPurpose,
  ): string {
    const baseUrl =
      this.configService.get<string>('app.frontendUrl') ||
      this.configService.get<string>('WEB_URL') ||
      process.env.WEB_URL ||
      'http://localhost:5173';

    const cleanBase = baseUrl.replace(/\/+$/, '');

    if (purpose === 'EMAIL_CHANGE') {
      return `${cleanBase}/verify-email#token=${encodeURIComponent(rawToken)}&purpose=email_change`;
    }

    return `${cleanBase}/verify-email#token=${encodeURIComponent(rawToken)}`;
  }

  async sendVerificationEmail(
    params: SendVerificationEmailParams,
  ): Promise<EmailDeliveryResult> {
    const { to, rawToken, purpose, username } = params;

    const verificationUrl = this.buildVerificationUrl(
      rawToken,
      purpose,
    );

    this.logger.log(
      `Sending ${purpose} email through ${this.adapter.name} to ${this.maskEmail(to)}`,
    );

    try {
      const result = await this.adapter.send({
        to,
        verificationUrl,
        purpose,
        username,
      });

      if (!result.success) {
        this.logger.error(
          `Email provider rejected delivery to ${this.maskEmail(to)}`,
        );

        return {
          success: false,
          messageId: result.messageId || '',
          status: 'FAILED',
          provider: this.adapter.name,
        };
      }

      // Never retain the actual verification URL or raw token.
      this.sentEmails.push({
        to,
        purpose,
        verificationUrl: '[REDACTED]',
        messageId: result.messageId,
        status: result.status,
        provider: this.adapter.name,
        sentAt: new Date(),
      });

      return {
        success: true,
        messageId: result.messageId,
        status: result.status,
        provider: this.adapter.name,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown email error';

      this.logger.error(
        `Email delivery failed for ${this.maskEmail(to)}: ${message}`,
      );

      return {
        success: false,
        messageId: '',
        status: 'FAILED',
        provider: this.adapter.name,
      };
    }
  }

  getSentEmails(): SentEmailRecord[] {
    return [...this.sentEmails];
  }

  clearSentEmails(): void {
    this.sentEmails.length = 0;
  }
}
