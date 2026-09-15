import React, { useState } from "react";
import { logout } from "../services/authService.js";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ activeTab, setActiveTab, currentHost }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.clear();
      navigate("/login");
    }
  };

  const navItems = [
    {
      id: "home",
      label: "Home Chat",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      badge: "Live"
    },
    {
      id: "news",
      label: "24h News Feed",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      badge: "Realtime"
    },
    {
      id: "blinknews",
      label: "BlinkNews",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      badge: "70-80 Word AI"
    },
    {
      id: "stock",
      label: "Stock Intelligence",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      badge: "Quant AI"
    }
  ];


  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-64"
      } h-screen sticky top-0 bg-blue-50 text-blue-950 flex flex-col justify-between p-3 border-r border-blue-200 shadow-sm transition-all duration-300 z-30 flex-shrink-0 overflow-hidden`}
    >
      <div className="flex-1 overflow-y-auto pr-0.5">
        {/* Header & Collapse Toggle */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-blue-200">
          {!collapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm shadow">
                ⚡
              </div>
              <div className="truncate">
                <h1 className="font-bold text-sm text-blue-900 tracking-tight">QuantPulse</h1>
                <p className="text-[10px] text-blue-600 font-medium">Dashboard Hub</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 transition-all ${
              collapsed ? "mx-auto" : ""
            }`}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">
              Menu
            </p>
          )}
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : ""}
                className={`w-full flex items-center ${
                  collapsed ? "justify-center px-0 py-2.5" : "justify-between px-3 py-2.5"
                } rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-blue-700 text-white shadow-sm font-bold"
                    : "text-blue-900 bg-white/60 hover:bg-blue-100 border border-blue-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-blue-900 text-blue-100" : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed Logout & User Profile Footer */}
      <div className="pt-3 border-t border-blue-200 flex flex-col gap-2 flex-shrink-0 bg-blue-50">
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : ""}
          className={`w-full flex items-center ${
            collapsed ? "justify-center px-0 py-2" : "justify-center gap-2 px-3 py-2"
          } bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all shadow-sm`}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span>Logout Account</span>}
        </button>

        {/* User Profile */}
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2"} px-1 pt-1`}>
          <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow flex-shrink-0">
            {currentHost?.name ? currentHost.name.charAt(0) : "U"}
          </div>
          {!collapsed && (
            <div className="truncate">
              <p className="text-xs font-bold text-blue-900 truncate">
                {currentHost?.name || "Logged User"}
              </p>
              <p className="text-[10px] text-blue-600 truncate">
                {currentHost?.email || "user@app.com"}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

