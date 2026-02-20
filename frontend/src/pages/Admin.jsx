import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import UsersTab from "./UsersTab";
import ContextsTab from "./ContextsTab";
import ConnectorsTab from "./ConnectorsTab";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-[#1a013f] to-[#2d0064] text-gray-100">
      <motion.h1
  initial={{ opacity: 0, y: -5 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
  className="text-xl font-semibold mb-4 text-pink-300 flex items-center gap-1"
>
  👑 Admin
</motion.h1>


      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {["users", "contexts", "connectors"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl font-semibold transition ${
              activeTab === tab
                ? "bg-pink-600 text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            {tab === "users" ? "Users" : tab === "contexts" ? "Contexts" : "Connectors"}
          </button>
        ))}
      </div>

      {/* Render tab */}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "contexts" && <ContextsTab />}
      {activeTab === "connectors" && <ConnectorsTab />}
    </div>
  );
}
