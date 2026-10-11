import { NextRequest } from "next/server";
import { Role, UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { userCreateSchema, zodErrorMessage } from "@/lib/validation";
import { hashPassword } from "@/lib/password";

function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "10", 10) || 10),
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  studentId: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** GET /api/users — admin-only user list (never exposes passwordHash). */
export async function GET(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const { page, pageSize, skip } = getPagination(searchParams);

    const and: Record<string, unknown>[] = [];

    const q = searchParams.get("q")?.trim();
    if (q) {
      and.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { studentId: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    const roleParam = searchParams.get("role");
    if (roleParam) {
      if (!(Object.values(Role) as string[]).includes(roleParam)) {
        return jsonError("Invalid role filter.", 400);
      }
      and.push({ role: roleParam as Role });
    }

    const statusParam = searchParams.get("status");
    if (statusParam) {
      if (!(Object.values(UserStatus) as string[]).includes(statusParam)) {
        return jsonError("Invalid status filter.", 400);
      }
      and.push({ status: statusParam as UserStatus });
    }

    const where = and.length > 0 ? { AND: and } : {};

    const [total, users] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        select: { ...safeUserSelect, _count: { select: { sessions: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return Response.json({
      data: users,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET /api/users failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** POST /api/users — create a staff account (ADMIN only). */
export async function POST(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => null);
    const parsed = userCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return jsonError("An account with this email already exists.", 409);
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        role: parsed.data.role,
      },
      select: safeUserSelect,
    });

    await logAudit({
      actorId: auth.user.id,
      action: "user.create",
      targetType: "User",
      targetId: user.id,
      details: { email: user.email, role: user.role },
      ip: getClientIp(req),
    });

    return Response.json(user, { status: 201 });
  } catch (error) {
    console.error("POST /api/users failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
