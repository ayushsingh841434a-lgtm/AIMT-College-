import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";

function getPagination(searchParams: URLSearchParams, defaultSize: number) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? String(defaultSize), 10) || defaultSize),
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

/** GET /api/audit-logs — admin-only audit trail with filters (default 20/page). */
export async function GET(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const { page, pageSize, skip } = getPagination(searchParams, 20);

    const where: Record<string, unknown> = {};

    const action = searchParams.get("action")?.trim();
    if (action) {
      where.action = { contains: action, mode: "insensitive" };
    }

    const actorId = searchParams.get("actorId")?.trim();
    if (actorId) {
      where.actorId = actorId;
    }

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const createdAt: Record<string, Date> = {};
    if (fromParam) {
      const from = new Date(fromParam);
      if (Number.isNaN(from.getTime())) {
        return jsonError("Invalid 'from' date.", 400);
      }
      createdAt.gte = from;
    }
    if (toParam) {
      const to = new Date(toParam);
      if (Number.isNaN(to.getTime())) {
        return jsonError("Invalid 'to' date.", 400);
      }
      createdAt.lte = to;
    }
    if (Object.keys(createdAt).length > 0) {
      where.createdAt = createdAt;
    }

    const [total, logs] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return Response.json({
      data: logs,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET /api/audit-logs failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
