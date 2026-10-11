import { NextRequest } from "next/server";
import { AttendanceStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { requirePermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { attendanceBulkSchema, zodErrorMessage } from "@/lib/validation";
import { isStaffRole } from "@/lib/roles";

function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "20", 10) || 20),
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

const includeAttendance = {
  student: { select: { id: true, name: true, email: true, studentId: true } },
  recorder: { select: { id: true, name: true } },
} as const;

/** GET /api/attendance — students see their own; staff can filter. */
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
      const date = searchParams.get("date");
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        where.date = new Date(`${date}T00:00:00Z`);
      }
    }
    const subject = searchParams.get("subject");
    if (subject) where.subject = subject;
    const statusParam = searchParams.get("status");
    if (statusParam) {
      if (!(Object.values(AttendanceStatus) as string[]).includes(statusParam)) {
        return jsonError("Invalid status filter.", 400);
      }
      where.status = statusParam as AttendanceStatus;
    }

    const [total, present, records] = await Promise.all([
      db.attendanceRecord.count({ where }),
      db.attendanceRecord.count({
        where: { ...where, status: "PRESENT" },
      }),
      db.attendanceRecord.findMany({
        where,
        include: includeAttendance,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
    ]);

    return Response.json({
      data: records,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      summary: {
        total,
        present,
        percentage: total === 0 ? 0 : Math.round((present / total) * 1000) / 10,
      },
    });
  } catch (error) {
    console.error("GET /api/attendance failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** POST /api/attendance — bulk mark attendance (MANAGEMENT/ADMIN). */
export async function POST(req: NextRequest) {
  const roleAuth = await requireRole("MANAGEMENT", "ADMIN");
  if (!roleAuth.ok) return roleAuth.response;
  const permAuth = await requirePermission("attendance.manage");
  if (!permAuth.ok) return permAuth.response;

  try {
    const body = await req.json().catch(() => null);
    const parsed = attendanceBulkSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }
    const { date, subject, entries } = parsed.data;
    const dateValue = new Date(`${date}T00:00:00Z`);

    // Every entry must target a real student account.
    const studentIds = [...new Set(entries.map((e) => e.studentId))];
    const students = await db.user.findMany({
      where: { id: { in: studentIds }, role: "STUDENT" },
      select: { id: true },
    });
    if (students.length !== studentIds.length) {
      return jsonError("Attendance can only be marked for student accounts.", 400);
    }

    const writes = entries.map((entry) =>
      db.attendanceRecord.upsert({
        where: {
          studentId_date_subject: {
            studentId: entry.studentId,
            date: dateValue,
            subject,
          },
        },
        update: { status: entry.status, recordedBy: roleAuth.user.id },
        create: {
          studentId: entry.studentId,
          date: dateValue,
          status: entry.status,
          subject,
          recordedBy: roleAuth.user.id,
        },
      }),
    );
    const saved = await db.$transaction(writes);

    await logAudit({
      actorId: roleAuth.user.id,
      action: "attendance.bulk_mark",
      targetType: "AttendanceRecord",
      details: { date, subject, count: saved.length },
      ip: getClientIp(req),
    });

    return Response.json({ saved: saved.length, date, subject }, { status: 201 });
  } catch (error) {
    console.error("POST /api/attendance failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
