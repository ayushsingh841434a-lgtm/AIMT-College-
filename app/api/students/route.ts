import { NextRequest } from "next/server";
import { UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";

function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "10", 10) || 10),
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

/** GET /api/students — staff-only student directory with search/filter/pagination. */
export async function GET(req: NextRequest) {
  const auth = await requireRole("MANAGEMENT", "ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const { page, pageSize, skip } = getPagination(searchParams);

    const and: Record<string, unknown>[] = [{ role: "STUDENT" }];

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

    const branch = searchParams.get("branch")?.trim();
    if (branch) {
      and.push({ profile: { branch: { contains: branch, mode: "insensitive" } } });
    }

    const yearParam = searchParams.get("year");
    if (yearParam) {
      const year = Number.parseInt(yearParam, 10);
      if (Number.isNaN(year)) {
        return jsonError("Invalid year filter.", 400);
      }
      and.push({ profile: { year } });
    }

    const statusParam = searchParams.get("status");
    if (statusParam) {
      if (!(Object.values(UserStatus) as string[]).includes(statusParam)) {
        return jsonError("Invalid status filter.", 400);
      }
      and.push({ status: statusParam as UserStatus });
    }

    const where = { AND: and };

    const [total, users] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        include: { profile: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    const data = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      studentId: u.studentId,
      status: u.status,
      branch: u.profile?.branch ?? null,
      year: u.profile?.year ?? null,
      course: u.profile?.course ?? null,
      createdAt: u.createdAt,
    }));

    return Response.json({
      data,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET /api/students failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
