import { Metadata } from "next";
import { OrganizationProvider } from "@/context/OrganizationContext";

export const metadata: Metadata = {
  title: "Command Center | Support AI",
  description: "Manage your AI support agent, monitor escalated tickets, and inspect real-time vector embeddings.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <OrganizationProvider>{children}</OrganizationProvider>;
}
