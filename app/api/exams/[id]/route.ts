import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { examUpdateSchema, zodErrorMessage } from "@/lib/validation";

const includeExam = {
  student: { select: { id: true, name: true, email: true, studentId: true } },
  recorder: { select: { id: true, name: true } },
} as const;

async function findExam(id: string) {
  return db.examResult.findUnique({ where: { id }, include: includeExam });
}

/** PATCH /api/exams/[id] — update an exam result (MANAGEMENT/ADMIN). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const roleAuth = await requireRole("MANAGEMENT", "ADMIN");
  if (!roleAuth.ok) return roleAuth.response;
  const permAuth = await requirePermission("exams.manage");
  if (!permAuth.ok) return permAuth.response;

  try {
    const { id } = await params;
    const existing = await findExam(id);
    if (!existing) return jsonError("Exam result not found.", 404);

    const body = await req.json().catch(() => null);
    const parsed = examUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const data = parsed.data;
    const marksObtained = data.marksObtained ?? existing.marksObtained;
    const maxMarks = data.maxMarks ?? existing.maxMarks;
    if (marksObtained > maxMarks) {
      return jsonError("Marks obtained cannot exceed maximum marks.", 400);
    }

    const updated = await db.examResult.update({
      where: { id },
      data: {
        ...(data.examName !== undefined ? { examName: data.examName } : {}),
        ...(data.subject !== undefined ? { subject: data.subject } : {}),
        ...(data.marksObtained !== undefined ? { marksObtained: data.marksObtained } : {}),
        ...(data.maxMarks !== undefined ? { maxMarks: data.maxMarks } : {}),
        ...(data.grade !== undefined ? { grade: data.grade } : {}),
      },
      include: includeExam,
    });

    await logAudit({
      actorId: roleAuth.user.id,
      action: "exam.update",
      targetType: "ExamResult",
      targetId: id,
      details: { studentId: updated.studentId, examName: updated.examName },
      ip: getClientIp(req),
    });

    return Response.json(updated);
  } catch (error) {
    console.error("PATCH /api/exams/[id] failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** DELETE /api/exams/[id] — delete an exam result (MANAGEMENT/ADMIN). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const roleAuth = await requireRole("MANAGEMENT", "ADMIN");
  if (!roleAuth.ok) return roleAuth.response;
  const permAuth = await requirePermission("exams.manage");
  if (!permAuth.ok) return permAuth.response;

  try {
    const { id } = await params;
    const existing = await findExam(id);
    if (!existing) return jsonError("Exam result not found.", 404);

    await db.examResult.delete({ where: { id } });

    await logAudit({
      actorId: roleAuth.user.id,
      action: "exam.delete",
      targetType: "ExamResult",
      targetId: id,
      details: { studentId: existing.studentId, examName: existing.examName },
      ip: getClientIp(req),
    });

    return Response.json({ message: "Exam result deleted." });
  } catch (error) {
    console.error("DELETE /api/exams/[id] failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
