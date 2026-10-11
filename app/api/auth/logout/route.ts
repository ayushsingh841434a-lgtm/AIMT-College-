import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/rbac";
import { destroySession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  const ip = getClientIp(req);

  await destroySession();

  if (user) {
    await logAudit({
      actorId: user.id,
      action: "auth.logout",
      targetType: "User",
      targetId: user.id,
      ip,
    });
  }

  return NextResponse.json({ message: "Signed out successfully." });
}
