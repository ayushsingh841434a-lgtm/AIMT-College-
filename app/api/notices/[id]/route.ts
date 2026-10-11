import { NextRequest } from "next/server";
import { NoticeAudience } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { noticeSchema, zodErrorMessage } from "@/lib/validation";

const includePublisher = { publisher: { select: { id: true, name: true } } } as const;

/** GET /api/notices/[id] — fetch one notice (students limited to ALL/STUDENT). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const notice = await db.notice.findUnique({
      where: { id },
      include: includePublisher,
    });
    if (!notice) {
      return jsonError("Notice not found.", 404);
    }

    const isStudent = auth.user.role === "STUDENT";
    if (isStudent && notice.audience === NoticeAudience.MANAGEMENT) {
      return jsonError("You do not have permission to view this notice.", 403);
    }

    if (!isStudent) {
      return Response.json(notice);
    }

    const read = await db.noticeRead.findUnique({
      where: { noticeId_userId: { noticeId: notice.id, userId: auth.user.id } },
      select: { id: true },
    });
    return Response.json({ ...notice, read: read !== null });
  } catch (error) {
    console.error("GET /api/notices/[id] failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** PATCH /api/notices/[id] — update a notice (MANAGEMENT/ADMIN). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole("MANAGEMENT", "ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const existing = await db.notice.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return jsonError("Notice not found.", 404);
    }

    const body = await req.json().catch(() => null);
    const parsed = noticeSchema.partial().safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const notice = await db.notice.update({
      where: { id },
      data: parsed.data,
      include: includePublisher,
    });

    await logAudit({
      actorId: auth.user.id,
      action: "notice.update",
      targetType: "Notice",
      targetId: notice.id,
      details: { title: notice.title, changes: Object.keys(parsed.data) },
      ip: getClientIp(req),
    });

    return Response.json(notice);
  } catch (error) {
    console.error("PATCH /api/notices/[id] failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** DELETE /api/notices/[id] — delete a notice (MANAGEMENT/ADMIN). Reads cascade. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole("MANAGEMENT", "ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const existing = await db.notice.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!existing) {
      return jsonError("Notice not found.", 404);
    }

    await db.notice.delete({ where: { id } });

    await logAudit({
      actorId: auth.user.id,
      action: "notice.delete",
      targetType: "Notice",
      targetId: id,
      details: { title: existing.title },
      ip: getClientIp(req),
    });

    return Response.json({ message: "Notice deleted." });
  } catch (error) {
    console.error("DELETE /api/notices/[id] failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
