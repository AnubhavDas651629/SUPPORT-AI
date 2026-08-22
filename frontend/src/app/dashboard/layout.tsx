import { OrganizationProvider } from "@/context/OrganizationContext";
import { AuthGuard } from "@/components/app/AuthGuard";
import { AppShell } from "@/components/app/AppShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <OrganizationProvider>
        <AppShell>{children}</AppShell>
      </OrganizationProvider>
    </AuthGuard>
  );
}
