import { NextRequest } from "next/server";
import { TaskStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { taskCreateSchema, zodErrorMessage } from "@/lib/validation";
import { isStaffRole } from "@/lib/roles";

function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "10", 10) || 10),
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

const includeTask = {
  assignee: { select: { id: true, name: true, email: true, studentId: true } },
  creator: { select: { id: true, name: true } },
} as const;

const taskOrder = [
  { dueDate: { sort: "asc" as const, nulls: "last" as const } },
  { createdAt: "desc" as const },
];

/** GET /api/tasks — students see their own tasks; staff see all with filters. */
export async function GET(req: NextRequest) {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const { page, pageSize, skip } = getPagination(searchParams);
    const staff = isStaffRole(auth.user.role);

    const statusParam = searchParams.get("status");
    if (statusParam && !(Object.values(TaskStatus) as string[]).includes(statusParam)) {
      return jsonError("Invalid status filter.", 400);
    }

    const where: Record<string, unknown> = {};
    if (!staff) {
      where.assignedTo = auth.user.id;
    } else {
      const assignedTo = searchParams.get("assignedTo");
      if (assignedTo) where.assignedTo = assignedTo;
    }
    if (statusParam) where.status = statusParam as TaskStatus;

    const [total, tasks] = await Promise.all([
      db.task.count({ where }),
      db.task.findMany({
        where,
        include: includeTask,
        orderBy: taskOrder,
        skip,
        take: pageSize,
      }),
    ]);

    return Response.json({
      data: tasks,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("GET /api/tasks failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** POST /api/tasks — assign a task to an active student (MANAGEMENT/ADMIN). */
export async function POST(req: NextRequest) {
  const auth = await requireRole("MANAGEMENT", "ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => null);
    const parsed = taskCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const target = await db.user.findUnique({
      where: { id: parsed.data.assignedTo },
      select: { id: true, role: true, status: true },
    });
    if (!target || target.role !== "STUDENT" || target.status !== "ACTIVE") {
      return jsonError("Tasks can only be assigned to active student accounts.", 400);
    }

    const task = await db.task.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        assignedTo: parsed.data.assignedTo,
        createdBy: auth.user.id,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        status: parsed.data.status ?? TaskStatus.PENDING,
      },
      include: includeTask,
    });

    await logAudit({
      actorId: auth.user.id,
      action: "task.create",
      targetType: "Task",
      targetId: task.id,
      details: { title: task.title, assignedTo: task.assignedTo },
      ip: getClientIp(req),
    });

    return Response.json(task, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
