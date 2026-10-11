import { NextRequest } from "next/server";
import { NoticeAudience } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";

/** POST /api/notices/[id]/read — mark a notice as read by the current user. */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const notice = await db.notice.findUnique({
      where: { id },
      select: { id: true, audience: true },
    });
    if (!notice) {
      return jsonError("Notice not found.", 404);
    }

    if (
      auth.user.role === "STUDENT" &&
      notice.audience === NoticeAudience.MANAGEMENT
    ) {
      return jsonError("You do not have permission to view this notice.", 403);
    }

    await db.noticeRead.upsert({
      where: { noticeId_userId: { noticeId: id, userId: auth.user.id } },
      create: { noticeId: id, userId: auth.user.id },
      update: {},
    });

    return Response.json({ message: "Notice marked as read." });
  } catch (error) {
    console.error("POST /api/notices/[id]/read failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
