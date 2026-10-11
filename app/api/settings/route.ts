import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
import { getSettingsMap, SETTING_KEYS } from "@/lib/settings";
import { settingsSchema, zodErrorMessage } from "@/lib/validation";

/** GET /api/settings — return all settings as a key/value map (ADMIN). */
export async function GET(_req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const map = await getSettingsMap([...SETTING_KEYS]);
    return Response.json(map);
  } catch (error) {
    console.error("GET /api/settings failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

/** PATCH /api/settings — update provided settings keys (ADMIN). */
export async function PATCH(req: NextRequest) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => null);
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(zodErrorMessage(parsed.error), 400);
    }

    const updatedKeys: string[] = [];
    for (const key of SETTING_KEYS) {
      const value = (parsed.data as Record<string, unknown>)[key];
      if (value === undefined) continue;
      await db.setting.upsert({
        where: { key },
        create: { key, value: value as Prisma.InputJsonValue },
        update: { value: value as Prisma.InputJsonValue },
      });
      updatedKeys.push(key);
    }

    if (updatedKeys.length === 0) {
      return jsonError("Provide at least one setting to update.", 400);
    }

    await logAudit({
      actorId: auth.user.id,
      action: "settings.update",
      targetType: "Setting",
      details: { keys: updatedKeys },
      ip: getClientIp(req),
    });

    const map = await getSettingsMap([...SETTING_KEYS]);
    return Response.json(map);
  } catch (error) {
    console.error("PATCH /api/settings failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
