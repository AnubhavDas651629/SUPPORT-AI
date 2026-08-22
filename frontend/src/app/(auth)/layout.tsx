import { PublicShell } from "@/components/public/PublicShell";

export default function AuthRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
