import { NextResponse } from "next/server";
import { getAuthUser, jsonError } from "@/lib/rbac";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return jsonError("Not authenticated.", 401);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      status: user.status,
    },
  });
}
