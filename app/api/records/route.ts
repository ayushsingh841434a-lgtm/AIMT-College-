import { NextRequest } from "next/server";
import { Prisma, RecordType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { recordCreateSchema, zodErrorMessage } from "@/lib/validation";
import { isStaffRole } from "@/lib/roles";

function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "10", 10) || 10),
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

const includeRecord = {
  student: { select: { id: true, name: true, email: true, studentId: true } },
  author: { select: { id: true, name: true } },
} as const;

/** GET /api/records — students see their own records; staff see all with filters. */
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

    const typeParam = searchParams.get("type");
    if (typeParam) {
      if (!(Object.values(RecordType) as string[]).includes(typeParam)) {
        return jsonError("Invalid record type filter.", 400);
      }
      where.type = typeParam as RecordType;
    }

    const [total, records] = await Promise.all([
      db.studentRecord.count({ where }),
      db.studentRecord.findMany({
        where,
        include: includeRecord,
        orderBy: { createdAt: "desc" },
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
    });
  } catch (error) {
    console.error("GET /api/records failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** POST /api/records — create a student record (MANAGEMENT/ADMIN). */
export async function POST(req: NextRequest) {
  const auth = await requireRole("MANAGEMENT", "ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => null);
    const parsed = recordCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const target = await db.user.findUnique({
      where: { id: parsed.data.studentId },
      select: { id: true, role: true },
    });
    if (!target || target.role !== "STUDENT") {
      return jsonError("Records can only be created for student accounts.", 400);
    }

    const record = await db.studentRecord.create({
      data: {
        studentId: parsed.data.studentId,
        type: parsed.data.type,
        title: parsed.data.title,
        details: (parsed.data.details ?? null) as Prisma.InputJsonValue,
        recordedBy: auth.user.id,
      },
      include: includeRecord,
    });

    await logAudit({
      actorId: auth.user.id,
      action: "record.create",
      targetType: "StudentRecord",
      targetId: record.id,
      details: { title: record.title, type: record.type, studentId: record.studentId },
      ip: getClientIp(req),
    });

    return Response.json(record, { status: 201 });
  } catch (error) {
    console.error("POST /api/records failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
