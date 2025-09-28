import { NextResponse } from "next/server"

export async function GET() {
  const cfg = {
    host: process.env.SMTP_HOST || null,
    port: process.env.SMTP_PORT || null,
    user: process.env.SMTP_USER ? "(set)" : "(not set)",
    from: process.env.SMTP_FROM || null,
    // IMPORTANT: never return SMTP_PASS
  }
  return NextResponse.json(cfg)
}
