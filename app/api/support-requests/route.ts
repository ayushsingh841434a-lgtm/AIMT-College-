import { NextRequest } from "next/server";
import { SupportStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { supportRequestSchema, zodErrorMessage } from "@/lib/validation";
import { isStaffRole } from "@/lib/roles";

function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "10", 10) || 10),
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

const includeUser = { user: { select: { id: true, name: true, email: true } } } as const;

/** GET /api/support-requests — students see their own; staff see all with ?status=. */
export async function GET(req: NextRequest) {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const { page, pageSize, skip } = getPagination(searchParams);
    const staff = isStaffRole(auth.user.role);

    const where: Record<string, unknown> = {};
    if (!staff) {
      where.userId = auth.user.id;
    }

    const statusParam = searchParams.get("status");
    if (statusParam) {
      if (!(Object.values(SupportStatus) as string[]).includes(statusParam)) {
        return jsonError("Invalid status filter.", 400);
      }
      where.status = statusParam as SupportStatus;
    }

    const [total, requests] = await Promise.all([
      db.supportRequest.count({ where }),
      db.supportRequest.findMany({
        where,
        include: includeUser,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return Response.json({
      data: requests,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET /api/support-requests failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** POST /api/support-requests — any authenticated user can open a support request. */
export async function POST(req: NextRequest) {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => null);
    const parsed = supportRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const request = await db.supportRequest.create({
      data: {
        subject: parsed.data.subject,
        message: parsed.data.message,
        userId: auth.user.id,
      },
      include: includeUser,
    });

    return Response.json(request, { status: 201 });
  } catch (error) {
    console.error("POST /api/support-requests failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
