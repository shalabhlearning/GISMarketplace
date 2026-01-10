import { Home, FileText, CheckSquare, Award, Clock } from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { name: 'Dashboard', icon: Home },
    { name: 'Available Quotes', icon: FileText },
    { name: 'Submitted Quotes', icon: CheckSquare },
    { name: 'Awarded Quotes', icon: Award },
    { name: 'Ongoing RFP', icon: Clock },
  ];

  return (
    <aside className="w-64 bg-white border-r h-screen flex flex-col">
      <div className="px-6 py-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          SC
        </div>
        <span className="font-bold text-xl text-gray-900">ServiceConnect</span>
      </div>

      <nav className="px-4 space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.name === 'Dashboard';
          return (
            <div
              key={item.name}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}