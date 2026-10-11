import { NextRequest } from "next/server";
import { NoticeAudience } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { noticeSchema, zodErrorMessage } from "@/lib/validation";
import { isStaffRole } from "@/lib/roles";

function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "10", 10) || 10),
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

/** GET /api/notices — list notices (students see ALL/STUDENT audience only). */
export async function GET(req: NextRequest) {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const { page, pageSize, skip } = getPagination(searchParams);
    const staff = isStaffRole(auth.user.role);

    let audienceFilter: { in: NoticeAudience[] } | undefined;
    if (staff) {
      const audienceParam = searchParams.get("audience");
      if (audienceParam) {
        if (!(Object.values(NoticeAudience) as string[]).includes(audienceParam)) {
          return jsonError("Invalid audience filter.", 400);
        }
        audienceFilter = { in: [audienceParam as NoticeAudience] };
      }
    } else {
      audienceFilter = { in: [NoticeAudience.ALL, NoticeAudience.STUDENT] };
    }

    const where = audienceFilter ? { audience: audienceFilter } : {};

    const [total, notices] = await Promise.all([
      db.notice.count({ where }),
      db.notice.findMany({
        where,
        include: { publisher: { select: { id: true, name: true } } },
        orderBy: { publishedAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    // Students get a `read` flag per notice.
    let readSet = new Set<string>();
    if (!staff && notices.length > 0) {
      const reads = await db.noticeRead.findMany({
        where: { userId: auth.user.id, noticeId: { in: notices.map((n) => n.id) } },
        select: { noticeId: true },
      });
      readSet = new Set(reads.map((r) => r.noticeId));
    }

    const data = notices.map((n) =>
      staff ? n : { ...n, read: readSet.has(n.id) },
    );

    return Response.json({
      data,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET /api/notices failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** POST /api/notices — publish a notice (MANAGEMENT/ADMIN). */
export async function POST(req: NextRequest) {
  const auth = await requireRole("MANAGEMENT", "ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => null);
    const parsed = noticeSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const notice = await db.notice.create({
      data: {
        title: parsed.data.title,
        body: parsed.data.body,
        audience: parsed.data.audience,
        publishedBy: auth.user.id,
      },
      include: { publisher: { select: { id: true, name: true } } },
    });

    await logAudit({
      actorId: auth.user.id,
      action: "notice.create",
      targetType: "Notice",
      targetId: notice.id,
      details: { title: notice.title, audience: notice.audience },
      ip: getClientIp(req),
    });

    return Response.json(notice, { status: 201 });
  } catch (error) {
    console.error("POST /api/notices failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
