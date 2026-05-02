const RESEND_ENDPOINT = "https://api.resend.com/emails";
const APP_NAME = "ALTFaze";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL ?? process.env.EMAIL_FROM ?? "ALTFaze <noreply@altfaze.com>";
}

function getResendKey() {
  return process.env.RESEND_API_KEY;
}

async function postResendEmail({ to, subject, html, text }: EmailPayload) {
  const apiKey = getResendKey();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to send authentication emails");
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromEmail(),
      to,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to send email: ${message}`);
  }

  return response.json();
}

function wrapTemplate(content: string) {
  return `
    <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:32px;box-shadow:0 10px 30px rgba(15,23,42,0.06);">
          <div style="font-size:14px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#475569;margin-bottom:20px;">${APP_NAME}</div>
          ${content}
        </div>
        <div style="text-align:center;color:#64748b;font-size:12px;padding:16px 12px;">
          If you did not request this email, you can safely ignore it.
        </div>
      </div>
    </div>
  `;
}

export function buildOtpEmail(otp: string) {
  return {
    subject: `${APP_NAME} verification code`,
    text: `Your ${APP_NAME} verification code is ${otp}. It expires in 5 minutes.`,
    html: wrapTemplate(`
      <h1 style="font-size:24px;line-height:1.2;margin:0 0 12px;font-weight:700;">Your verification code</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#334155;">Enter the one-time code below to sign in or create your account. It expires in 5 minutes.</p>
      <div style="font-size:34px;letter-spacing:.35em;font-weight:800;background:#f8fafc;border:1px solid #cbd5e1;border-radius:16px;padding:18px 20px;text-align:center;margin:0 0 24px;">${otp}</div>
      <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;">If you did not request this code, ignore this email.</p>
    `),
  };
}

export function buildPasswordResetEmail(resetUrl: string) {
  return {
    subject: `${APP_NAME} password reset`,
    text: `Reset your ${APP_NAME} password using this link: ${resetUrl}`,
    html: wrapTemplate(`
      <h1 style="font-size:24px;line-height:1.2;margin:0 0 12px;font-weight:700;">Reset your password</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#334155;">Use the secure link below to choose a new password. The link expires in 15 minutes.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px;margin:0 0 20px;">Reset password</a>
      <p style="margin:0;font-size:13px;line-height:1.7;color:#64748b;word-break:break-all;">Or copy and paste this link: ${resetUrl}</p>
    `),
  };
}

export async function sendOtpEmail(to: string, otp: string) {
  const email = buildOtpEmail(otp);
  return postResendEmail({ to, ...email });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const email = buildPasswordResetEmail(resetUrl);
  return postResendEmail({ to, ...email });
}