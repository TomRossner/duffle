import { readFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";

export function appOrigin() {
  const configured = process.env.AUTH_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim());
}

type MailLink = { label: string; url: string };

export type AuthMail = {
  to: string;
  subject: string;
  heading: string;
  paragraphs: string[];
  action: MailLink;
  secondary?: MailLink;
  note?: string;
};

const logoCid = "duffle-logo@duffle";

const colors = {
  page: "#f3f5f9",
  card: "#ffffff",
  ink: "#1f2a3d",
  muted: "#5f6b80",
  border: "#e3e8f0",
  brand: "#264b82",
  accent: "#f0782d",
};

const fontStack =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderText(mail: AuthMail) {
  const lines = [mail.heading, "", ...mail.paragraphs.flatMap((p) => [p, ""])];
  lines.push(`${mail.action.label}: ${mail.action.url}`);
  if (mail.secondary) lines.push(`${mail.secondary.label}: ${mail.secondary.url}`);
  if (mail.note) lines.push("", mail.note);
  lines.push("", "— Duffle", appOrigin());
  return lines.join("\n");
}

function renderHtml(mail: AuthMail, withLogo: boolean) {
  const origin = appOrigin();
  const paragraphs = mail.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:${colors.ink};">${escapeHtml(p)}</p>`,
    )
    .join("");

  const button = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px auto 24px;">
      <tr>
        <td align="center" bgcolor="${colors.brand}" style="border-radius:10px;">
          <a href="${escapeHtml(mail.action.url)}" target="_blank"
             style="display:inline-block;padding:14px 28px;font-family:${fontStack};font-size:16px;font-weight:600;line-height:20px;color:#ffffff;text-decoration:none;border-radius:10px;">
            ${escapeHtml(mail.action.label)}
          </a>
        </td>
      </tr>
    </table>`;

  const secondary = mail.secondary
    ? `<p style="margin:0 0 24px;text-align:center;font-size:14px;line-height:20px;">
         <a href="${escapeHtml(mail.secondary.url)}" target="_blank" style="color:${colors.brand};font-weight:600;text-decoration:underline;">${escapeHtml(mail.secondary.label)}</a>
       </p>`
    : "";

  const note = mail.note
    ? `<p style="margin:0 0 20px;font-size:14px;line-height:20px;color:${colors.muted};">${escapeHtml(mail.note)}</p>`
    : "";

  const logo = withLogo
    ? `<img src="cid:${logoCid}" width="96" height="94" alt="Duffle" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;height:auto;max-width:96px;" />`
    : `<span style="font-size:28px;font-weight:700;color:${colors.brand};">Duffle</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(mail.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${colors.page};font-family:${fontStack};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(mail.paragraphs[0] ?? mail.heading)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${colors.page}" style="background-color:${colors.page};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <a href="${escapeHtml(origin)}" target="_blank" style="text-decoration:none;">${logo}</a>
            </td>
          </tr>
          <tr>
            <td bgcolor="${colors.card}" style="background-color:${colors.card};border:1px solid ${colors.border};border-radius:16px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td height="4" bgcolor="${colors.accent}" style="height:4px;line-height:4px;font-size:0;background:linear-gradient(90deg,#3d7cc9 0%,${colors.accent} 50%,#5dbb4f 100%);">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:32px 32px 12px;font-family:${fontStack};">
                    <h1 style="margin:0 0 20px;font-size:22px;line-height:30px;font-weight:700;color:${colors.ink};">${escapeHtml(mail.heading)}</h1>
                    ${paragraphs}
                    ${button}
                    ${secondary}
                    ${note}
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 32px 28px;border-top:1px solid ${colors.border};font-family:${fontStack};">
                    <p style="margin:0 0 6px;font-size:12px;line-height:18px;color:${colors.muted};">If the button doesn't work, paste this link into your browser:</p>
                    <p style="margin:0;font-size:12px;line-height:18px;word-break:break-all;">
                      <a href="${escapeHtml(mail.action.url)}" target="_blank" style="color:${colors.brand};text-decoration:underline;">${escapeHtml(mail.action.url)}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 16px 0;font-family:${fontStack};font-size:12px;line-height:18px;color:${colors.muted};">
              Duffle · One place for the whole trip.<br />
              <a href="${escapeHtml(origin)}" target="_blank" style="color:${colors.muted};text-decoration:underline;">${escapeHtml(origin.replace(/^https?:\/\//, ""))}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

let logoCache: Promise<Buffer | null> | undefined;

function loadLogo() {
  logoCache ??= readFile(path.join(process.cwd(), "public", "email-logo.png")).catch((error) => {
    console.error("Email logo missing.", error instanceof Error ? error.message : error);
    logoCache = undefined;
    return null;
  });
  return logoCache;
}

export async function deliverAuthMail(mail: AuthMail) {
  const text = renderText(mail);

  if (!mailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return { error: "Email delivery is not configured yet." } as const;
    }
    console.info(`[mail] ${mail.subject} -> ${mail.to}\n${text}`);
    return { ok: true as const, devLink: mail.action.url };
  }

  try {
    const logo = await loadLogo();
    const port = Number(process.env.SMTP_PORT || 587);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === "true" || port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to: mail.to,
      subject: mail.subject,
      text,
      html: renderHtml(mail, Boolean(logo)),
      attachments: logo
        ? [{ filename: "duffle-logo.png", content: logo, cid: logoCid, contentType: "image/png" }]
        : undefined,
    });
    return { ok: true as const };
  } catch (error) {
    console.error("Mail send failed.", error instanceof Error ? error.message : error);
    return { error: "Could not send the email. Try again." } as const;
  }
}
