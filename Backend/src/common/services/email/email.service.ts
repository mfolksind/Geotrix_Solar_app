import nodemailer, { Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { env } from '../../../config/env';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  cc?: string;
  bcc?: string;
  attachments?: Mail.Attachment[];
}

export interface EmailTemplate {
  subject: string;
  text: string;
  html: string;
}

const EMAIL_HOST = env.SMTP_HOST;
const EMAIL_PORT = Number(env.SMTP_PORT);
const EMAIL_SECURE = process.env.EMAIL_SECURE === 'true';
const EMAIL_USER = env.SMTP_USER;
const EMAIL_PASS = env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM ?? env.SMTP_USER;
const EMAIL_TLS_REJECT_UNAUTHORIZED = process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false';

let transporter: Transporter | null = null;

const createTransporter = (): Transporter =>
  nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: EMAIL_TLS_REJECT_UNAUTHORIZED,
    },
    connectionTimeout: 30000,
  });

const getTransporter = async (): Promise<Transporter> => {
  if (!transporter) {
    transporter = createTransporter();
    await transporter.verify();
  }
  return transporter;
};

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const mailer = await getTransporter();
  await mailer.sendMail({
    from: options.from ?? EMAIL_FROM,
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  });
}
