export default function Sidebar() {
  return (
    <div className="w-72 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="px-8 py-8 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-blue-600">AdminGate</h1>
      </div>

      {/* Main Menu */}
      <div className="px-6 py-8">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">MAIN MENU</p>
        
        <div className="space-y-1">
          <div className="px-4 py-3 text-sm font-medium bg-blue-50 text-blue-700 rounded-2xl flex items-center gap-3">
            RFP Review Queue
          </div>

          <div className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-100 rounded-2xl cursor-pointer flex items-center gap-3">
            Dashboard
          </div>

          <div className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-100 rounded-2xl cursor-pointer flex items-center gap-3">
            Provider Directory
          </div>

          <div className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-100 rounded-2xl cursor-pointer flex items-center gap-3">
            Analytics
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="px-6 mt-auto pb-8">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">SETTINGS</p>
        
        <div className="space-y-1">
          <div className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-100 rounded-2xl cursor-pointer flex items-center gap-3">
            Governance Rules
          </div>
          <div className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-100 rounded-2xl cursor-pointer flex items-center gap-3">
            Audit Logs
          </div>
        </div>
      </div>

      {/* Bottom User Info */}
      <div className="border-t border-gray-100 p-6 mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
          <div>
            <p className="font-medium text-sm">Alex Miller</p>
            <p className="text-xs text-gray-500">Head Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}