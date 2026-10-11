// Seed script for the AIMT College Management System.
// Run with: npx tsx prisma/seed.ts
// Reads configuration from environment variables (or a local .env file).

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

/** Load a .env file into process.env (only for keys not already set). */
function loadDotEnv(): void {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const db = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@aimt.edu";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
const DEMO_MANAGER_EMAIL = process.env.DEMO_MANAGER_EMAIL ?? "manager@aimt.edu";
const DEMO_STUDENT_EMAIL = process.env.DEMO_STUDENT_EMAIL ?? "student@aimt.edu";

async function main(): Promise<void> {
  // --- Administrator ---
  const admin = await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      name: "Administrator",
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  // --- Demo manager ---
  const manager = await db.user.upsert({
    where: { email: DEMO_MANAGER_EMAIL },
    update: {},
    create: {
      name: "Demo Manager",
      email: DEMO_MANAGER_EMAIL,
      passwordHash: await bcrypt.hash("Manager123!", 12),
      role: "MANAGEMENT",
      status: "ACTIVE",
    },
  });

  // --- Demo students ---
  const studentsData = [
    {
      name: "Aarav Sharma",
      email: DEMO_STUDENT_EMAIL,
      studentId: "AIMT2024001",
      phone: "+91-9000000001",
      branch: "CSE",
    },
    {
      name: "Priya Verma",
      email: "aarav.sharma@aimt.edu",
      studentId: "AIMT2024002",
      phone: "+91-9000000002",
      branch: "IT",
    },
    {
      name: "Rohan Gupta",
      email: "priya.verma@aimt.edu",
      studentId: "AIMT2024003",
      phone: "+91-9000000003",
      branch: "ECE",
    },
  ];

  const students = [];
  for (const s of studentsData) {
    const user = await db.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        name: s.name,
        email: s.email,
        studentId: s.studentId,
        passwordHash: await bcrypt.hash("Student123!", 12),
        role: "STUDENT",
        status: "ACTIVE",
      },
    });
    await db.studentProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        phone: s.phone,
        course: "B.Tech",
        branch: s.branch,
        year: 2,
        semester: 3,
        admissionYear: 2024,
        guardianName: `${s.name.split(" ")[0]} Guardian`,
        guardianPhone: "+91-9111111111",
      },
    });
    students.push(user);
  }

  // --- Notices ---
  await db.notice.createMany({
    data: [
      {
        title: "Welcome to AIMT College Management System",
        body: "This portal is the single place for notices, tasks, records, and support at Ambalika Institute of Management and Technology, Lucknow. Please complete your profile and check the notice board regularly.",
        audience: "ALL",
        publishedBy: admin.id,
      },
      {
        title: "Mid-semester examinations begin 20 Nov 2026",
        body: "Mid-semester examinations for all branches begin on 20 November 2026. Admit cards will be available on this portal from 15 November 2026. Students must clear pending fee dues to receive their admit cards.",
        audience: "STUDENT",
        publishedBy: manager.id,
      },
      {
        title: "Staff meeting on 15 Oct 2026",
        body: "A staff meeting is scheduled in the conference hall on 15 October 2026 at 11:00 AM to discuss the upcoming placement drive and departmental targets for the semester.",
        audience: "MANAGEMENT",
        publishedBy: admin.id,
      },
    ],
    skipDuplicates: true,
  });

  // --- Tasks assigned by the manager to the students ---
  await db.task.createMany({
    data: [
      {
        title: "Submit internship report",
        description:
          "Upload your summer internship report with company certificate and a brief summary of your learning outcomes.",
        assignedTo: students[0]!.id,
        createdBy: manager.id,
        dueDate: new Date("2026-11-05T23:59:59Z"),
        status: "PENDING",
      },
      {
        title: "Complete library membership renewal",
        description:
          "Renew your library membership for the academic year by submitting the filled form and a passport-size photograph at the central library.",
        assignedTo: students[1]!.id,
        createdBy: manager.id,
        dueDate: new Date("2026-10-31T23:59:59Z"),
        status: "IN_PROGRESS",
      },
      {
        title: "Attend career counselling session",
        description:
          "Attend the career counselling session organised by the placement cell and submit a one-page reflection note.",
        assignedTo: students[2]!.id,
        createdBy: manager.id,
        dueDate: new Date("2026-10-25T23:59:59Z"),
        status: "COMPLETED",
      },
    ],
  });

  // --- Student records recorded by the manager ---
  await db.studentRecord.createMany({
    data: [
      {
        studentId: students[0]!.id,
        type: "ACADEMIC",
        title: "Mid-semester performance review",
        details: { semester: 3, subjects: 6, average: 78.5, remarks: "Consistent performance" },
        recordedBy: manager.id,
      },
      {
        studentId: students[1]!.id,
        type: "ATTENDANCE",
        title: "September attendance summary",
        details: { month: "September 2026", percentage: 92, classesHeld: 48, classesAttended: 44 },
        recordedBy: manager.id,
      },
      {
        studentId: students[2]!.id,
        type: "FEE",
        title: "Tuition fee receipt — semester 3",
        details: { amount: 55000, currency: "INR", receiptNo: "FEE-2026-1042", paidOn: "2026-08-20" },
        recordedBy: manager.id,
      },
    ],
  });

  // --- Settings ---
  const settings: Array<{ key: string; value: unknown }> = [
    { key: "siteName", value: "Ambalika Institute of Management and Technology" },
    { key: "supportEmail", value: "support@aimt.edu" },
    { key: "allowRegistration", value: true },
    { key: "sessionDays", value: 1 },
  ];
  for (const s of settings) {
    await db.setting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: s.value as never },
    });
  }

  // --- Permission catalog + default role matrix ---
  // (Admins can change these at runtime from Roles & Permissions.)
  const PERMISSION_DEFS: Array<{ key: string; label: string; description: string }> = [
    { key: "users.view", label: "View users", description: "View the list of user accounts." },
    { key: "users.manage", label: "Manage users", description: "Create, activate, deactivate and edit user accounts." },
    { key: "roles.assign", label: "Assign roles & permissions", description: "Change user roles and edit the permission matrix." },
    { key: "notices.publish", label: "Publish notices", description: "Create, edit and delete college notices." },
    { key: "tasks.manage", label: "Manage tasks", description: "Create and assign tasks / assignments to students." },
    { key: "records.manage", label: "Manage student records", description: "Add, edit and delete student records." },
    { key: "reports.generate", label: "Generate reports", description: "Generate and view analytical reports." },
    { key: "attendance.manage", label: "Manage attendance", description: "Mark and edit student attendance." },
    { key: "exams.manage", label: "Manage exam results", description: "Enter and edit examination results." },
    { key: "settings.manage", label: "Manage system settings", description: "Change system-wide configuration." },
    { key: "audit.view", label: "View audit logs", description: "Inspect the audit trail of administrative actions." },
    { key: "support.manage", label: "Manage support requests", description: "View and resolve student support requests." },
  ];
  const DEFAULT_MATRIX: Record<string, string[]> = {
    ADMIN: PERMISSION_DEFS.map((p) => p.key),
    MANAGEMENT: [
      "notices.publish",
      "tasks.manage",
      "records.manage",
      "reports.generate",
      "attendance.manage",
      "exams.manage",
      "support.manage",
    ],
    STUDENT: [],
  };
  for (const def of PERMISSION_DEFS) {
    await db.permission.upsert({
      where: { key: def.key },
      update: { label: def.label, description: def.description },
      create: def,
    });
  }
  for (const [role, keys] of Object.entries(DEFAULT_MATRIX)) {
    const rows = await db.permission.findMany({
      where: { key: { in: keys } },
      select: { id: true },
    });
    await db.rolePermission.deleteMany({ where: { role: role as "ADMIN" } });
    if (rows.length > 0) {
      await db.rolePermission.createMany({
        data: rows.map((p) => ({ role: role as "ADMIN", permissionId: p.id })),
      });
    }
  }

  // --- Demo attendance (clearly seed data, not official records) ---
  const demoDate = new Date("2026-10-09T00:00:00Z");
  for (const [i, student] of students.entries()) {
    await db.attendanceRecord.upsert({
      where: {
        studentId_date_subject: {
          studentId: student.id,
          date: demoDate,
          subject: "General",
        },
      },
      update: {},
      create: {
        studentId: student.id,
        date: demoDate,
        status: i === 2 ? "ABSENT" : "PRESENT",
        subject: "General",
        recordedBy: manager.id,
      },
    });
  }

  // --- Demo exam results (clearly seed data, not official records) ---
  await db.examResult.createMany({
    data: [
      {
        studentId: students[0]!.id,
        examName: "Mid-Semester Examination — Sem 3",
        subject: "Data Structures",
        marksObtained: 68,
        maxMarks: 100,
        grade: "B+",
        recordedBy: manager.id,
      },
      {
        studentId: students[0]!.id,
        examName: "Mid-Semester Examination — Sem 3",
        subject: "Operating Systems",
        marksObtained: 74,
        maxMarks: 100,
        grade: "A",
        recordedBy: manager.id,
      },
      {
        studentId: students[1]!.id,
        examName: "Mid-Semester Examination — Sem 3",
        subject: "Database Systems",
        marksObtained: 81,
        maxMarks: 100,
        grade: "A+",
        recordedBy: manager.id,
      },
    ],
  });

  console.log("Seed completed successfully.");
  console.log(`Admin account: ${ADMIN_EMAIL}`);
  console.log(`Manager account: ${DEMO_MANAGER_EMAIL}`);
  console.log(`Student accounts: ${students.map((s) => s.email).join(", ")}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
