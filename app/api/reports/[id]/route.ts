import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireRole, jsonError } from "@/lib/rbac";

/** GET /api/reports/[id] — fetch one generated report (MANAGEMENT/ADMIN). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole("MANAGEMENT", "ADMIN");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const report = await db.report.findUnique({
      where: { id },
      include: { generator: { select: { id: true, name: true } } },
    });
    if (!report) {
      return jsonError("Report not found.", 404);
    }
    return Response.json(report);
  } catch (error) {
    console.error("GET /api/reports/[id] failed:", error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
