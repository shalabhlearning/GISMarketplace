import DashboardShell from "@/components/dashboard/DashboardShell";

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
