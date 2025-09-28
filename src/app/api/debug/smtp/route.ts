import { NextRequest, NextResponse } from "next/server"
import { requireDirector } from "@/lib/authz"
import { verifySmtp } from "@/lib/mail"

export async function GET(req: NextRequest) {
  const gate = await requireDirector(req)
  if (!gate.ok) return gate.res

  const result = await verifySmtp()
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
