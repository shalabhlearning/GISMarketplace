// src/components/admin/AdminLayout.tsx
import Sidebar from './Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}