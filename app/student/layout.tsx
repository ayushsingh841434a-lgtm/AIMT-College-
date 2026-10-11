import type { Metadata } from "next";
import DashboardShell, { type NavItem } from "@/components/DashboardShell";

export const metadata: Metadata = {
  title: "Student Portal",
};

const navItems: NavItem[] = [
  { href: "/student/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/student/profile", label: "My Profile", icon: "profile" },
  { href: "/student/notices", label: "College Notices", icon: "notices" },
  { href: "/student/tasks", label: "My Tasks", icon: "tasks" },
  { href: "/student/records", label: "My Records", icon: "records" },
  { href: "/student/attendance", label: "Attendance", icon: "attendance" },
  { href: "/student/examinations", label: "Examinations", icon: "examinations" },
  { href: "/student/help", label: "Help & Support", icon: "help" },
  { href: "/student/change-password", label: "Change Password", icon: "password" },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell title="Student Portal" accent="student" navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
