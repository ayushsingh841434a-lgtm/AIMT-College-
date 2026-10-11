import { z } from "zod";
import {
  AttendanceStatus,
  NoticeAudience,
  RecordType,
  Role,
  TaskStatus,
  UserStatus,
} from "@prisma/client";

const nameSchema = z
  .string({ required_error: "Name is required" })
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be at most 100 characters");

const emailSchema = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .max(255, "Email must be at most 255 characters")
  .email("Please enter a valid email address");

const strongPasswordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(
    /^(?=.*[A-Za-z])(?=.*\d).+$/,
    "Password must contain at least one letter and one digit",
  );

const cuidSchema = z.string().min(1, "ID is required");

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    studentId: z
      .string()
      .trim()
      .max(50, "Student ID must be at most 50 characters")
      .transform((v) => (v === "" ? undefined : v))
      .optional(),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export const noticeSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  body: z
    .string({ required_error: "Body is required" })
    .trim()
    .min(10, "Body must be at least 10 characters"),
  audience: z.nativeEnum(NoticeAudience).default(NoticeAudience.ALL),
});

export const taskCreateSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string({ required_error: "Description is required" })
    .trim()
    .min(10, "Description must be at least 10 characters"),
  assignedTo: cuidSchema.describe("Assignee user ID"),
  dueDate: z
    .string()
    .datetime({ offset: true, message: "Due date must be a valid ISO date" })
    .optional(),
  status: z.nativeEnum(TaskStatus).optional(),
});

export const taskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus, { required_error: "Status is required" }),
});

export const recordCreateSchema = z.object({
  studentId: cuidSchema.describe("Student user ID"),
  type: z.nativeEnum(RecordType, { required_error: "Record type is required" }),
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  details: z.unknown().optional(),
});

export const userCreateSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: strongPasswordSchema,
    role: z.nativeEnum(Role, { required_error: "Role is required" }),
  })
  .refine((data) => data.role !== Role.STUDENT, {
    message: "Public registration is the only way to create student accounts",
    path: ["role"],
  });

export const userUpdateSchema = z
  .object({
    name: nameSchema.optional(),
    studentId: z.string().trim().max(50).nullable().optional(),
    status: z.nativeEnum(UserStatus).optional(),
    role: z.nativeEnum(Role).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });

export const profileUpdateSchema = z.object({
  phone: z.string().trim().max(30, "Phone must be at most 30 characters").optional(),
  gender: z.string().trim().max(30, "Gender must be at most 30 characters").optional(),
  address: z.string().trim().max(500, "Address must be at most 500 characters").optional(),
  course: z.string().trim().max(100, "Course must be at most 100 characters").optional(),
  branch: z.string().trim().max(100, "Branch must be at most 100 characters").optional(),
  year: z
    .number()
    .int("Year must be a whole number")
    .min(1, "Year must be between 1 and 6")
    .max(6, "Year must be between 1 and 6")
    .optional(),
  semester: z
    .number()
    .int("Semester must be a whole number")
    .min(1, "Semester must be between 1 and 12")
    .max(12, "Semester must be between 1 and 12")
    .optional(),
  admissionYear: z
    .number()
    .int("Admission year must be a whole number")
    .min(1990, "Admission year must be between 1990 and 2100")
    .max(2100, "Admission year must be between 1990 and 2100")
    .optional(),
  guardianName: z
    .string()
    .trim()
    .max(100, "Guardian name must be at most 100 characters")
    .optional(),
  guardianPhone: z
    .string()
    .trim()
    .max(30, "Guardian phone must be at most 30 characters")
    .optional(),
  dateOfBirth: z
    .string()
    .datetime({ offset: true, message: "Date of birth must be a valid ISO date" })
    .optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: strongPasswordSchema,
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: strongPasswordSchema,
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export const settingsSchema = z.object({
  siteName: z.string().trim().min(3, "Site name must be at least 3 characters").optional(),
  supportEmail: z.string().trim().email("Please enter a valid support email").optional(),
  allowRegistration: z.boolean().optional(),
  sessionDays: z
    .number()
    .int("Session days must be a whole number")
    .min(1, "Session days must be between 1 and 30")
    .max(30, "Session days must be between 1 and 30")
    .optional(),
});

export const supportRequestSchema = z.object({
  subject: z
    .string({ required_error: "Subject is required" })
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be at most 200 characters"),
  message: z
    .string({ required_error: "Message is required" })
    .trim()
    .min(10, "Message must be at least 10 characters"),
});

const REPORT_TYPES = ["students-by-branch", "students-by-year", "task-completion", "notices"] as const;

export const reportGenerateSchema = z.object({
  type: z.enum(REPORT_TYPES, { errorMap: () => ({ message: "Invalid report type" }) }),
  title: z.string().trim().max(200, "Title must be at most 200 characters").optional(),
  parameters: z.unknown().optional(),
});

const dateOnlySchema = z
  .string({ required_error: "Date is required" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), {
    message: "Date must be a valid calendar date",
  });

export const attendanceBulkSchema = z.object({
  date: dateOnlySchema,
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(100, "Subject must be at most 100 characters")
    .default("General"),
  entries: z
    .array(
      z.object({
        studentId: cuidSchema.describe("Student user ID"),
        status: z.nativeEnum(AttendanceStatus, { required_error: "Status is required" }),
      }),
    )
    .min(1, "At least one attendance entry is required")
    .max(500, "Too many entries in one request"),
});

export const examCreateSchema = z
  .object({
    studentId: cuidSchema.describe("Student user ID"),
    examName: z
      .string({ required_error: "Exam name is required" })
      .trim()
      .min(2, "Exam name must be at least 2 characters")
      .max(150, "Exam name must be at most 150 characters"),
    subject: z
      .string({ required_error: "Subject is required" })
      .trim()
      .min(2, "Subject must be at least 2 characters")
      .max(150, "Subject must be at most 150 characters"),
    marksObtained: z
      .number({ required_error: "Marks obtained is required" })
      .min(0, "Marks cannot be negative")
      .max(100000, "Marks are unrealistically large"),
    maxMarks: z
      .number({ required_error: "Maximum marks is required" })
      .min(1, "Maximum marks must be at least 1")
      .max(100000, "Maximum marks are unrealistically large"),
    grade: z.string().trim().max(10, "Grade must be at most 10 characters").optional(),
  })
  .refine((data) => data.marksObtained <= data.maxMarks, {
    message: "Marks obtained cannot exceed maximum marks",
    path: ["marksObtained"],
  });

export const examUpdateSchema = z
  .object({
    examName: z.string().trim().min(2).max(150).optional(),
    subject: z.string().trim().min(2).max(150).optional(),
    marksObtained: z.number().min(0).max(100000).optional(),
    maxMarks: z.number().min(1).max(100000).optional(),
    grade: z.string().trim().max(10).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  })
  .refine(
    (data) =>
      data.marksObtained === undefined ||
      data.maxMarks === undefined ||
      data.marksObtained <= data.maxMarks,
    {
      message: "Marks obtained cannot exceed maximum marks",
      path: ["marksObtained"],
    },
  );

export const rolePermissionsSchema = z.object({
  role: z.nativeEnum(Role, { required_error: "Role is required" }),
  permissions: z
    .array(z.string().min(1))
    .max(100, "Too many permissions")
    .refine((arr) => new Set(arr).size === arr.length, {
      message: "Duplicate permissions are not allowed",
    }),
});

// Inferred input types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type NoticeInput = z.infer<typeof noticeSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskStatusInput = z.infer<typeof taskStatusSchema>;
export type RecordCreateInput = z.infer<typeof recordCreateSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type SupportRequestInput = z.infer<typeof supportRequestSchema>;
export type ReportGenerateInput = z.infer<typeof reportGenerateSchema>;
export type AttendanceBulkInput = z.infer<typeof attendanceBulkSchema>;
export type ExamCreateInput = z.infer<typeof examCreateSchema>;
export type ExamUpdateInput = z.infer<typeof examUpdateSchema>;
export type RolePermissionsInput = z.infer<typeof rolePermissionsSchema>;

/** Return the first issue message from a ZodError. */
export function zodErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Validation failed";
}
