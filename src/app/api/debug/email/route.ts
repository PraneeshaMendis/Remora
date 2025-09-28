// src/app/api/debug/email/route.ts
import { NextRequest, NextResponse } from "next/server"
import { sendBasicEmail } from "@/lib/mail"
import { requireDirector } from "@/lib/authz"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const gate = await requireDirector(req)
  if (!gate.ok) return gate.res

  try {
    const { to, subject, html, text } = (await req.json()) as {
      to?: string
      subject?: string
      html?: string
      text?: string
    }

    if (!to || !EMAIL_RE.test(to)) {
      return NextResponse.json({ error: "Valid 'to' email is required." }, { status: 400 })
    }

    const sub = subject?.trim() || "Remora SMTP Test"
    const bodyHtml =
      html ??
      `<p>Hello 👋</p><p>This is a test email from <b>Remora</b> via MailerSend SMTP.</p><p>If you see this, SMTP is working!</p>`
    const bodyText = text ?? "This is a test email from Remora via MailerSend SMTP."

    const result = await sendBasicEmail({ to, subject: sub, html: bodyHtml, text: bodyText })
    return NextResponse.json({ ok: true, result })
  } catch (err: any) {
    // Expose the provider error so we can diagnose (dev-only endpoint)
    const message = err?.response || err?.message || String(err)
    console.error("POST /api/debug/email error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
