import { NextRequest } from "next/server";
import { z } from "zod";
import { SupportStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { zodErrorMessage } from "@/lib/validation";

const statusSchema = z.object({
  status: z.nativeEnum(SupportStatus, { required_error: "Status is required" }),
});

/** PATCH /api/support-requests/[id] — update a request's status (MANAGEMENT/ADMIN). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole("MANAGEMENT", "ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const existing = await db.supportRequest.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return jsonError("Support request not found.", 404);
    }

    const body = await req.json().catch(() => null);
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const request = await db.supportRequest.update({
      where: { id },
      data: { status: parsed.data.status },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    await logAudit({
      actorId: auth.user.id,
      action: "support-request.update",
      targetType: "SupportRequest",
      targetId: request.id,
      details: { status: request.status },
      ip: getClientIp(req),
    });

    return Response.json(request);
  } catch (error) {
    console.error("PATCH /api/support-requests/[id] failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
