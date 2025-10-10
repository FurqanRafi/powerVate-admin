export default function Sidebar({ activePage, setActivePage, onLogout }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "doctors", label: "Doctors", icon: "⚕️" },
    { id: "discount", label: "Discount", icon: "🏷️" },
    { id: "pricing", label: "Pricing Plans", icon: "💰" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="w-64 bg-blue-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-blue-800">
        <h1 className="text-2xl font-bold text-white">PowerVate</h1>
        <p className="text-blue-200 text-sm mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition duration-200 ${
              activePage === item.id
                ? "bg-white text-blue-900 font-semibold"
                : "text-white hover:bg-blue-800"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <button
          onClick={onLogout}
          className=" fixed bottom-5 flex items-center space-x-3 px-4 py-3 rounded-lg text-white hover:bg-blue-800 transition duration-200"
        >
          <span className="text-xl">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
