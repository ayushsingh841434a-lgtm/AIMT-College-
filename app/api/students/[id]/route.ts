import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";

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

/** GET /api/students/[id] — full student detail for staff (MANAGEMENT/ADMIN). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole("MANAGEMENT", "ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      select: { ...safeUserSelect, profile: true },
    });

    if (!user || user.role !== "STUDENT") {
      return jsonError("Student not found.", 404);
    }

    const [recentRecords, tasks] = await Promise.all([
      db.studentRecord.findMany({
        where: { studentId: id },
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.task.findMany({
        where: { assignedTo: id },
        include: { creator: { select: { id: true, name: true } } },
        orderBy: [
          { dueDate: { sort: "asc", nulls: "last" } },
          { createdAt: "desc" },
        ],
        take: 10,
      }),
    ]);

    return Response.json({ user, profile: user.profile, recentRecords, tasks });
  } catch (error) {
    console.error("GET /api/students/[id] failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
