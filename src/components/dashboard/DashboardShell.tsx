import Sidebar from './Sidebar';

export default function DashboardShell({
  children,
  title = "Provider Dashboard",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-10">
          <header>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              {title}
            </h1>
          </header>

          {children}
        </div>
      </main>
    </div>
  );
}