import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { examCreateSchema, zodErrorMessage } from "@/lib/validation";
import { isStaffRole } from "@/lib/roles";

function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "20", 10) || 20),
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

const includeExam = {
  student: { select: { id: true, name: true, email: true, studentId: true } },
  recorder: { select: { id: true, name: true } },
} as const;

/** GET /api/exams — students see their own results; staff can filter by student. */
export async function GET(req: NextRequest) {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const { page, pageSize, skip } = getPagination(searchParams);
    const staff = isStaffRole(auth.user.role);

    const where: Record<string, unknown> = {};
    if (!staff) {
      where.studentId = auth.user.id;
    } else {
      const studentId = searchParams.get("studentId");
      if (studentId) where.studentId = studentId;
    }
    const examName = searchParams.get("examName");
    if (examName) where.examName = { contains: examName, mode: "insensitive" };

    const [total, exams] = await Promise.all([
      db.examResult.count({ where }),
      db.examResult.findMany({
        where,
        include: includeExam,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
    ]);

    return Response.json({
      data: exams,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET /api/exams failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** POST /api/exams — record an exam result (MANAGEMENT/ADMIN). */
export async function POST(req: NextRequest) {
  const roleAuth = await requireRole("MANAGEMENT", "ADMIN");
  if (!roleAuth.ok) return roleAuth.response;
  const permAuth = await requirePermission("exams.manage");
  if (!permAuth.ok) return permAuth.response;

  try {
    const body = await req.json().catch(() => null);
    const parsed = examCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const target = await db.user.findUnique({
      where: { id: parsed.data.studentId },
      select: { id: true, role: true },
    });
    if (!target || target.role !== "STUDENT") {
      return jsonError("Exam results can only be recorded for student accounts.", 400);
    }

    const exam = await db.examResult.create({
      data: {
        studentId: parsed.data.studentId,
        examName: parsed.data.examName,
        subject: parsed.data.subject,
        marksObtained: parsed.data.marksObtained,
        maxMarks: parsed.data.maxMarks,
        grade: parsed.data.grade || null,
        recordedBy: roleAuth.user.id,
      },
      include: includeExam,
    });

    await logAudit({
      actorId: roleAuth.user.id,
      action: "exam.create",
      targetType: "ExamResult",
      targetId: exam.id,
      details: {
        studentId: exam.studentId,
        examName: exam.examName,
        subject: exam.subject,
      },
      ip: getClientIp(req),
    });

    return Response.json(exam, { status: 201 });
  } catch (error) {
    console.error("POST /api/exams failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
