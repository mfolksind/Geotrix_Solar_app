import { EmailTemplate } from './email.service';

const APP_NAME = process.env.EMAIL_APP_NAME ?? 'Geotrix';

const wrapHtml = (subject: string, body: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${subject}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 24px 48px rgba(15,23,42,0.08);">
            <tr>
              <td style="padding:32px 40px;">
                <h1 style="margin:0 0 18px;color:#102a43;font-size:24px;line-height:1.3;">${subject}</h1>
                ${body}
                <p style="margin:28px 0 0;color:#334e68;font-size:14px;line-height:1.7;">Thanks,<br />The ${APP_NAME} Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const createButton = (label: string, url: string): string =>
  `<p style="margin:24px 0 0;text-align:center;"><a href="${url}" style="display:inline-block;padding:14px 28px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;">${label}</a></p>`;

const createPlainText = (lines: string[]): string => lines.join('\n\n');

export function buildVerifyEmailTemplate(params: { name?: string; verifyUrl: string; appName?: string }): EmailTemplate {
  const name = params.name ?? 'Customer';
  const subject = 'Verify your email address';
  const appName = params.appName ?? APP_NAME;
  const text = createPlainText([
    `Hi ${name},`,
    `Thanks for signing up for ${appName}. Please verify your email address by clicking the link below:`,
    params.verifyUrl,
    `If you did not create this account, you can safely ignore this message.`,
    `— ${appName} Team`,
  ]);
  const html = wrapHtml(
    subject,
    `<p style="margin:0 0 18px;color:#334e68;line-height:1.7;">Hi ${name},</p>
     <p style="margin:0 0 18px;color:#334e68;line-height:1.7;">Thanks for signing up for ${appName}. Please verify your email address to activate your account.</p>
     ${createButton('Verify Email', params.verifyUrl)}
     <p style="margin:24px 0 0;color:#8898aa;line-height:1.7;">If you did not request this email, you can ignore it.</p>`,
  );

  return { subject, text, html };
}

export function buildResendVerificationTemplate(params: { name?: string; verifyUrl: string; appName?: string }): EmailTemplate {
  const name = params.name ?? 'Customer';
  const subject = 'Resend email verification link';
  const appName = params.appName ?? APP_NAME;
  const text = createPlainText([
    `Hi ${name},`,
    `You requested a new verification link for ${appName}. Click the link below to verify your email:`,
    params.verifyUrl,
    `If you did not request this, you can ignore this message.`,
    `— ${appName} Team`,
  ]);
  const html = wrapHtml(
    subject,
    `<p style="margin:0 0 18px;color:#334e68;line-height:1.7;">Hi ${name},</p>
     <p style="margin:0 0 18px;color:#334e68;line-height:1.7;">You requested a new verification link for ${appName}. Please click the button below to complete verification.</p>
     ${createButton('Resend Verification', params.verifyUrl)}
     <p style="margin:24px 0 0;color:#8898aa;line-height:1.7;">If you did not request this, you can ignore it.</p>`,
  );

  return { subject, text, html };
}

export function buildForgotPasswordTemplate(params: { name?: string; resetUrl: string; appName?: string }): EmailTemplate {
  const name = params.name ?? 'Customer';
  const subject = 'Reset your password';
  const appName = params.appName ?? APP_NAME;
  const text = createPlainText([
    `Hi ${name},`,
    `We received a request to reset your password for your ${appName} account. Click the link below to choose a new password:`,
    params.resetUrl,
    `If you didn’t request a password reset, you can ignore this email.`,
    `— ${appName} Team`,
  ]);
  const html = wrapHtml(
    subject,
    `<p style="margin:0 0 18px;color:#334e68;line-height:1.7;">Hi ${name},</p>
     <p style="margin:0 0 18px;color:#334e68;line-height:1.7;">We received a request to reset your password for your ${appName} account.</p>
     ${createButton('Reset Password', params.resetUrl)}
     <p style="margin:24px 0 0;color:#8898aa;line-height:1.7;">If you did not request this, please ignore this email.</p>`,
  );

  return { subject, text, html };
}

export function buildWelcomeEmailTemplate(params: { name?: string; appName?: string }): EmailTemplate {
  const name = params.name ?? 'Customer';
  const appName = params.appName ?? APP_NAME;
  const subject = `Welcome to ${appName}`;
  const text = createPlainText([
    `Hi ${name},`,
    `Welcome to ${appName}! We’re excited to have you on board.`,
    `If you have any questions, reply to this email and we’ll be happy to help.`,
    `— ${appName} Team`,
  ]);
  const html = wrapHtml(
    subject,
    `<p style="margin:0 0 18px;color:#334e68;line-height:1.7;">Hi ${name},</p>
     <p style="margin:0 0 18px;color:#334e68;line-height:1.7;">Welcome to ${appName}! We’re excited to have you on board.</p>
     <p style="margin:24px 0 0;color:#8898aa;line-height:1.7;">If you have any questions, just reply to this email.</p>`,
  );

  return { subject, text, html };
}

export function buildPasswordChangedTemplate(params: { name?: string; appName?: string }): EmailTemplate {
  const name = params.name ?? 'Customer';
  const appName = params.appName ?? APP_NAME;
  const subject = 'Your password was changed';
  const text = createPlainText([
    `Hi ${name},`,
    `This is a confirmation that the password for your ${appName} account was successfully changed.`,
    `If you did not make this change, contact support immediately.`,
    `— ${appName} Team`,
  ]);
  const html = wrapHtml(
    subject,
    `<p style="margin:0 0 18px;color:#334e68;line-height:1.7;">Hi ${name},</p>
     <p style="margin:0 0 18px;color:#334e68;line-height:1.7;">This is a confirmation that your ${appName} password was successfully changed.</p>
     <p style="margin:24px 0 0;color:#8898aa;line-height:1.7;">If you did not make this change, contact support immediately.</p>`,
  );

  return { subject, text, html };
}
