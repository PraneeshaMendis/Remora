// src/app/api/projects/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, description: true, status: true, createdAt: true },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session) return NextResponse.json({ error: "Unauthorized: no session" }, { status: 401 });

  const user = (session as any).user || {};
  const userId = (user.id ?? "") as string;
  const role = String(user.role ?? "").toUpperCase(); // 👈 normalize

  if (!userId || !role) {
    return NextResponse.json(
      { error: "Unauthorized: missing userId/role", user },
      { status: 401 }
    );
  }

  if (!["DIRECTOR", "MANAGER"].includes(role)) {
    return NextResponse.json(
      { error: "Forbidden: role not allowed to create projects", roleSeen: role, user },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      name: String(body.name),
      description: body.description ?? null,
      status: body.status ?? "Active",
      members: { create: [{ userId, role }] },
    },
    select: { id: true, name: true, description: true, status: true, createdAt: true },
  });

  return NextResponse.json(project, { status: 201 });
}
