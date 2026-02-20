import React, { useState } from "react";
import { FaLock, FaExclamationTriangle } from "react-icons/fa";
import { motion } from "framer-motion";

export default function Settings() {
  const [privacyMode, setPrivacyMode] = useState(true);
  const [accessControl, setAccessControl] = useState({
    SAP: true,
    CRM: true,
    SQL: true,
    Documents: false,
    API: true,
  });

  const recentWarnings = [
    { source: "Documents", time: "2025-10-16 14:22", message: "Unauthorized access attempt" },
    { source: "SQL", time: "2025-10-15 09:10", message: "Access token expired" },
  ];

  const handleToggleSource = (source) => {
    setAccessControl({ ...accessControl, [source]: !accessControl[source] });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a013f] to-[#2d0064] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <motion.h1
          className="text-3xl font-bold text-center text-pink-300 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🧭 Settings / Privacy Center
        </motion.h1>

        {/* Privacy Mode Toggle */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 flex justify-between items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <FaLock className="w-6 h-6 text-pink-300" />
            <div>
              <h2 className="text-xl font-semibold">Privacy Mode</h2>
              <p className="text-gray-300 text-sm">
                When enabled, AI can only access allowed data sources.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={privacyMode}
              onChange={() => setPrivacyMode(!privacyMode)}
              className="sr-only"
            />
            <div
              className={`w-14 h-8 bg-gray-500 rounded-full transition-all duration-300 ${
                privacyMode ? "bg-pink-500" : ""
              }`}
            ></div>
            <div
              className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                privacyMode ? "translate-x-6" : ""
              }`}
            ></div>
          </label>
        </motion.div>

        {/* Access Control */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-semibold text-pink-300 mb-4">Manage Access Per Data Source</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(accessControl).map((source) => (
              <label
                key={source}
                className="flex items-center gap-2 p-3 bg-white/10 rounded-xl cursor-pointer hover:bg-white/20 transition-all"
              >
                <input
                  type="checkbox"
                  checked={accessControl[source]}
                  onChange={() => handleToggleSource(source)}
                  className="accent-pink-500 w-5 h-5"
                />
                {source}
              </label>
            ))}
          </div>
        </motion.div>

        {/* Recent Access Warnings */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-semibold text-pink-300 mb-4 flex items-center gap-2">
            <FaExclamationTriangle /> Recent Access Warnings
          </h2>
          <div className="space-y-3">
            {recentWarnings.length === 0 && <p className="text-gray-300">No warnings.</p>}
            {recentWarnings.map((warn, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-3 bg-red-600/20 rounded-xl border border-red-400/30"
              >
                <div>
                  <p className="font-semibold">{warn.source}</p>
                  <p className="text-gray-300 text-sm">{warn.message}</p>
                </div>
                <p className="text-gray-200 text-sm">{warn.time}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
