import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { taskCreateSchema, taskStatusSchema, zodErrorMessage } from "@/lib/validation";

const includeTask = {
  assignee: { select: { id: true, name: true, email: true, studentId: true } },
  creator: { select: { id: true, name: true } },
} as const;

/**
 * PATCH /api/tasks/[id] — students may update {status} on their own tasks;
 * staff may update any task's status/title/description/dueDate.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const task = await db.task.findUnique({
      where: { id },
      select: { id: true, assignedTo: true },
    });
    if (!task) {
      return jsonError("Task not found.", 404);
    }

    const isStudent = auth.user.role === "STUDENT";
    if (isStudent && task.assignedTo !== auth.user.id) {
      return jsonError("You can only update your own tasks.", 403);
    }

    const body = await req.json().catch(() => null);
    // Staff schema: title/description/dueDate/status (no reassignment here).
    const schema = isStudent
      ? taskStatusSchema
      : taskCreateSchema.omit({ assignedTo: true }).partial();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = { ...data };
    if ("dueDate" in updateData && updateData.dueDate !== undefined) {
      updateData.dueDate = new Date(updateData.dueDate as string);
    }

    const updated = await db.task.update({
      where: { id },
      data: updateData,
      include: includeTask,
    });

    return Response.json(updated);
  } catch (error) {
    console.error("PATCH /api/tasks/[id] failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** DELETE /api/tasks/[id] — delete a task (MANAGEMENT/ADMIN). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole("MANAGEMENT", "ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const task = await db.task.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!task) {
      return jsonError("Task not found.", 404);
    }

    await db.task.delete({ where: { id } });

    await logAudit({
      actorId: auth.user.id,
      action: "task.delete",
      targetType: "Task",
      targetId: id,
      details: { title: task.title },
      ip: getClientIp(req),
    });

    return Response.json({ message: "Task deleted." });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
