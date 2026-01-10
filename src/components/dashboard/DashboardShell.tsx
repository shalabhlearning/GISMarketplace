import Sidebar from "@/components/dashboard/Sidebar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-blue-50 to-cyan-50">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10">
        <div className="text-base leading-normal font-sans">
          {children}
        </div>
      </main>
    </div>
  );
}
