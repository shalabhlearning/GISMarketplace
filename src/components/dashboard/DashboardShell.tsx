// src/components/dashboard/DashboardShell.tsx (unchanged except import name)
import Sidebar from './Sidebar';
import DashboardHeader from './Header';  // ← make sure this points to the file above

export default function DashboardShell({
  children,
  title = "Dashboard",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <DashboardHeader />  {/* ← This is now your top bar */}

        <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}