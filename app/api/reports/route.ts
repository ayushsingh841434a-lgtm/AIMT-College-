import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { reportGenerateSchema, zodErrorMessage } from "@/lib/validation";

function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "10", 10) || 10),
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

const includeGenerator = { generator: { select: { id: true, name: true } } } as const;

/** GET /api/reports — staff-only list of generated reports. */
export async function GET(req: NextRequest) {
  const auth = await requireRole("MANAGEMENT", "ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const { page, pageSize, skip } = getPagination(searchParams);

    const [total, reports] = await Promise.all([
      db.report.count(),
      db.report.findMany({
        include: includeGenerator,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return Response.json({
      data: reports,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET /api/reports failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** Run real Prisma aggregations for a report type. */
async function buildReportData(type: string): Promise<unknown> {
  switch (type) {
    case "students-by-branch": {
      const rows = await db.studentProfile.groupBy({
        by: ["branch"],
        where: { branch: { not: null }, user: { role: "STUDENT", status: "ACTIVE" } },
        _count: { _all: true },
      });
      const breakdown = rows.map((r) => ({
        branch: r.branch ?? "Not specified",
        count: r._count._all,
      }));
      return { breakdown, total: breakdown.reduce((sum, r) => sum + r.count, 0) };
    }
    case "students-by-year": {
      const rows = await db.studentProfile.groupBy({
        by: ["year"],
        where: { year: { not: null }, user: { role: "STUDENT", status: "ACTIVE" } },
        _count: { _all: true },
      });
      const breakdown = rows
        .map((r) => ({ year: r.year, count: r._count._all }))
        .sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
      return { breakdown, total: breakdown.reduce((sum, r) => sum + r.count, 0) };
    }
    case "task-completion": {
      const rows = await db.task.groupBy({
        by: ["status"],
        _count: { _all: true },
      });
      const breakdown = rows.map((r) => ({ status: r.status, count: r._count._all }));
      return { breakdown, total: breakdown.reduce((sum, r) => sum + r.count, 0) };
    }
    case "notices": {
      const rows = await db.notice.groupBy({
        by: ["audience"],
        _count: { _all: true },
      });
      const recent = await db.notice.findMany({
        select: { id: true, title: true, audience: true, publishedAt: true },
        orderBy: { publishedAt: "desc" },
        take: 5,
      });
      const byAudience = rows.map((r) => ({ audience: r.audience, count: r._count._all }));
      return {
        byAudience,
        total: byAudience.reduce((sum, r) => sum + r.count, 0),
        recent,
      };
    }
    default:
      throw new Error(`Unknown report type: ${type}`);
  }
}

/** POST /api/reports — generate and persist a report (MANAGEMENT/ADMIN). */
export async function POST(req: NextRequest) {
  const auth = await requireRole("MANAGEMENT", "ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => null);
    const parsed = reportGenerateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const data = await buildReportData(parsed.data.type);

    const report = await db.report.create({
      data: {
        title: parsed.data.title?.trim() || `${parsed.data.type} report`,
        type: parsed.data.type,
        parameters: (parsed.data.parameters ?? null) as Prisma.InputJsonValue,
        data: data as Prisma.InputJsonValue,
        generatedBy: auth.user.id,
      },
      include: includeGenerator,
    });

    await logAudit({
      actorId: auth.user.id,
      action: "report.generate",
      targetType: "Report",
      targetId: report.id,
      details: { title: report.title, type: report.type },
      ip: getClientIp(req),
    });

    return Response.json(report, { status: 201 });
  } catch (error) {
    console.error("POST /api/reports failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
