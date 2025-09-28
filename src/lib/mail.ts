// src/lib/mail.ts
import nodemailer from "nodemailer"

function hasSmtpEnv() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM
  )
}

export async function sendInviteEmail(to: string, link: string, role: string) {
  if (!hasSmtpEnv()) {
    console.warn("[mail] SMTP env not configured. Skipping send. Link:", link)
    return { skipped: true }
  }

  const port = Number(process.env.SMTP_PORT || 587)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: false,                    // STARTTLS on 587
  requireTLS: true,                 // enforce TLS upgrade
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
  logger: true,                     // <-- enable logs
  debug: true,                      // <-- verbose SMTP debug
  tls: {
    servername: process.env.SMTP_HOST, // SNI
  },
})

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height:1.6;">
      <h2 style="margin:0 0 12px">Welcome to Remora</h2>
      <p>You’ve been invited to join Remora as <b>${role}</b>.</p>
      <p>Click the secure link below to complete your registration:</p>
      <p>
        <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none">
          Accept Invitation
        </a>
      </p>
      <p style="font-size:12px;color:#6b7280">
        If the button doesn’t work, copy and paste this URL:<br/>
        <span style="word-break:break-all">${link}</span>
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
      <p style="font-size:12px;color:#6b7280">If you didn’t expect this, you can ignore this email.</p>
    </div>
  `

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM!,
    to,
    subject: "Your Remora Invitation",
    html,
  })

  return { messageId: info.messageId }
}

// NEW: generic mail sender for testing and future reuse
export async function sendBasicEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html?: string
  text?: string
}) {
  if (!hasSmtpEnv()) {
    console.warn("[mail] SMTP env not configured. Skipping send.")
    return { skipped: true }
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  })

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM!,
    to,
    subject,
    // Prefer HTML, fallback to text
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
  })

  return { messageId: info.messageId }
}
// Verify SMTP connection/settings (no email sent)
export async function verifySmtp() {
  const missing = [
    !process.env.SMTP_HOST && "SMTP_HOST",
    !process.env.SMTP_PORT && "SMTP_PORT",
    !process.env.SMTP_USER && "SMTP_USER",
    !process.env.SMTP_PASS && "SMTP_PASS",
    !process.env.SMTP_FROM && "SMTP_FROM",
  ].filter(Boolean)

  if (missing.length) {
    return { ok: false, error: `Missing env: ${missing.join(", ")}` }
  }

  const nodemailer = await import("nodemailer")
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, // STARTTLS
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  })

  try {
    await transporter.verify()
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) }
  }
}
