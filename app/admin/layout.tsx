import DashboardShell, { type NavItem } from "@/components/DashboardShell";

export const metadata = {
  title: "Admin Portal | AIMT College Management System",
};

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/users", label: "User Management", icon: "students" },
  { href: "/admin/management", label: "Management Accounts", icon: "management" },
  { href: "/admin/roles", label: "Roles & Permissions", icon: "roles" },
  { href: "/admin/settings", label: "System Settings", icon: "settings" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: "audit" },
  { href: "/admin/security", label: "Account Security", icon: "security" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      title="Admin Portal"
      accent="admin"
      navItems={navItems}
    >
      {children}
    </DashboardShell>
  );
}
