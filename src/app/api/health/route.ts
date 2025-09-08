// make this endpoint always dynamic (no caching)
export const dynamic = "force-dynamic"

export async function GET() {
  return Response.json({
    ok: true,
    message: "Remora API is healthy ✅",
    serverTime: new Date().toISOString(),
  })
}
