import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { recordCreateSchema, zodErrorMessage } from "@/lib/validation";

const patchSchema = recordCreateSchema.pick({ title: true, type: true, details: true });

const includeRecord = {
  student: { select: { id: true, name: true, email: true, studentId: true } },
  author: { select: { id: true, name: true } },
} as const;

/** PATCH /api/records/[id] — update a student record (MANAGEMENT/ADMIN). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole("MANAGEMENT", "ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const existing = await db.studentRecord.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return jsonError("Record not found.", 404);
    }

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.type !== undefined) data.type = parsed.data.type;
    if (parsed.data.details !== undefined) {
      data.details = parsed.data.details as Prisma.InputJsonValue;
    }

    const record = await db.studentRecord.update({
      where: { id },
      data,
      include: includeRecord,
    });

    await logAudit({
      actorId: auth.user.id,
      action: "record.update",
      targetType: "StudentRecord",
      targetId: record.id,
      details: { title: record.title, changes: Object.keys(data) },
      ip: getClientIp(req),
    });

    return Response.json(record);
  } catch (error) {
    console.error("PATCH /api/records/[id] failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** DELETE /api/records/[id] — delete a student record (MANAGEMENT/ADMIN). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole("MANAGEMENT", "ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const existing = await db.studentRecord.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!existing) {
      return jsonError("Record not found.", 404);
    }

    await db.studentRecord.delete({ where: { id } });

    await logAudit({
      actorId: auth.user.id,
      action: "record.delete",
      targetType: "StudentRecord",
      targetId: id,
      details: { title: existing.title },
      ip: getClientIp(req),
    });

    return Response.json({ message: "Record deleted." });
  } catch (error) {
    console.error("DELETE /api/records/[id] failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
