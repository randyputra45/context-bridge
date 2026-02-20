import React, { useContext } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FaDatabase, FaChartBar, FaHistory, FaCode, FaSignOutAlt } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";
import { RiAdminLine } from "react-icons/ri";
import { AuthContext } from "../context/AuthContext";

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const menuItems = [
    { name: "Dashboard", path: "/", icon: <FaChartBar /> },
    { name: "Query Studio", path: "/query-studio", icon: <FaCode /> },
    { name: "History", path: "/history", icon: <FaHistory /> },
    { name: "Data Schema", path: "/data-schema", icon: <FaDatabase /> },
    { name: "Settings", path: "/settings", icon: <IoSettingsSharp /> },
    ...(user?.isAdmin
      ? [{ name: "Admin", path: "/admin", icon: <RiAdminLine /> }]
      : []),
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#12002f] via-[#1a013f] to-[#2a0b52] text-gray-100">
      <nav className="bg-gradient-to-r from-[#3a0ca3] via-[#7209b7] to-[#b5179e] px-6 md:px-10 py-4 shadow-xl flex justify-between items-center backdrop-blur-md border-b border-purple-700/30">
        <div className="text-2xl font-extrabold tracking-wide flex items-center gap-3">
          <span className="bg-white text-[#7209b7] rounded-full px-2 py-1 shadow-md text-lg">
            QT
          </span>
          <span className="hover:text-pink-200 transition-colors">QANTARA</span>
        </div>

        <ul className="hidden md:flex gap-8 items-center">
          {menuItems.map((item) => (
            <li key={item.path} className="relative group flex items-center">
              <Link
                to={item.path}
                className={`flex items-center gap-2 transition-all duration-300 text-sm md:text-base ${
                  location.pathname === item.path
                    ? "text-pink-300 font-semibold"
                    : "text-gray-200 hover:text-pink-300"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-200 hover:text-pink-300"
            >
              <FaSignOutAlt /> Logout
            </button>
          </li>
        </ul>

        <div className="md:hidden text-sm text-gray-200">ContextBridge</div>
      </nav>

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      <footer className="text-center py-4 text-sm text-gray-400 border-t border-purple-700/20">
        © {new Date().getFullYear()} ContextBridge — Empowering Data Intelligence
      </footer>
    </div>
  );
}
