import nodemailer from "nodemailer";

export function appOrigin() {
  const configured = process.env.AUTH_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim());
}

export async function deliverAuthMail(input: { to: string; subject: string; text: string; link: string }) {
  if (!mailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return { error: "Email delivery is not configured yet." } as const;
    }
    console.info(`[mail] ${input.subject} -> ${input.to}\n${input.text}`);
    return { ok: true as const, devLink: input.link };
  }

  try {
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
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { ok: true as const };
  } catch (error) {
    console.error("Mail send failed.", error instanceof Error ? error.message : error);
    return { error: "Could not send the email. Try again." } as const;
  }
}
