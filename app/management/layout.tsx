import DashboardShell, { type NavItem } from "@/components/DashboardShell";

export const metadata = {
  title: "Management Portal | AIMT College Management System",
};

const navItems: NavItem[] = [
  { href: "/management/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/management/students", label: "Student Records", icon: "students" },
  { href: "/management/reports", label: "Reports & Analytics", icon: "reports" },
  { href: "/management/tools", label: "Management Tools", icon: "tools" },
  { href: "/management/notices", label: "College Notices", icon: "notices" },
  { href: "/management/academic", label: "Academic Information", icon: "academic" },
  { href: "/management/settings", label: "Settings", icon: "settings" },
];

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      title="Management Portal"
      accent="management"
      navItems={navItems}
    >
      {children}
    </DashboardShell>
  );
}
