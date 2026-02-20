import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaBrain,
  FaLock,
  FaDatabase,
  FaProjectDiagram,
} from "react-icons/fa";

export default function Dashboard() {
  const [logs] = useState([
    {
      query: "Total sales by region last month",
      source: "CRM",
      context: "Sales dataset",
      time: "10:32 AM",
      status: "Success",
    },
    {
      query: "Average satisfaction by department",
      source: "HR DB",
      context: "Employee survey",
      time: "09:15 AM",
      status: "Success",
    },
    {
      query: "Top performing product categories",
      source: "Analytics DB",
      context: "Product data",
      time: "08:50 AM",
      status: "Success",
    },
  ]);

  const summaryCards = [
    {
      title: "Queries Today",
      value: "128",
      icon: <FaBrain />,
      color: "text-pink-400",
    },
    {
      title: "Active Context Profiles",
      value: "6",
      icon: <FaProjectDiagram />,
      color: "text-purple-400",
    },
    {
      title: "Privacy Mode",
      value: "ON",
      icon: <FaLock />,
      color: "text-green-400",
    },
    {
      title: "Connected Data Sources",
      value: "4",
      icon: <FaDatabase />,
      color: "text-yellow-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a013f] to-[#2d0064] text-gray-100 p-8">
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-bold mb-10 text-center text-pink-300 tracking-wide"
      >
        ContextBridge Dashboard
      </motion.h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {summaryCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-lg hover:bg-white/20 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={`${card.color} text-3xl`}>{card.icon}</div>
              <div>
                <p className="text-sm text-gray-300">{card.title}</p>
                <h2 className="text-2xl font-semibold text-white">{card.value}</h2>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Logs */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-pink-300">
          Recent Query Activity
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-200 border-collapse">
            <thead>
              <tr className="border-b border-white/20 text-sm text-gray-400">
                <th className="py-2 px-3">Query</th>
                <th className="py-2 px-3">Source</th>
                <th className="py-2 px-3">Context</th>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr
                  key={i}
                  className="border-b border-white/10 hover:bg-white/10 transition-all"
                >
                  <td className="py-2 px-3">{log.query}</td>
                  <td className="py-2 px-3">{log.source}</td>
                  <td className="py-2 px-3">{log.context}</td>
                  <td className="py-2 px-3">{log.time}</td>
                  <td
                    className={`py-2 px-3 font-medium ${
                      log.status === "Success" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {log.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
