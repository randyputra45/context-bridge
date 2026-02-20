import 'aframe';
import 'aframe-extras';

import React, { useState, useRef, useEffect } from "react";
//import ForceGraph2D from "react-force-graph-2d";
import { FaDatabase, FaFileAlt, FaServer, FaPlug, FaPlus } from "react-icons/fa";
import { motion } from "framer-motion";
import { ForceGraph2D } from "react-force-graph";




export default function DataSchema() {
  const [newSource, setNewSource] = useState({ type: "", url: "", token: "" });
  const [dataSources, setDataSources] = useState([
    { name: "SAP", type: "ERP", status: true },
    { name: "CRM", type: "CRM", status: true },
    { name: "SQL DB", type: "SQL", status: true },
    { name: "Documents", type: "File", status: false },
    { name: "REST API", type: "API", status: true },
  ]);

  const [sampleData] = useState([
    { id: 1, name: "Alice", dept: "Sales", revenue: "$120K" },
    { id: 2, name: "Bob", dept: "Marketing", revenue: "$95K" },
    { id: 3, name: "Charlie", dept: "Support", revenue: "$80K" },
  ]);

  const graphData = {
    nodes: [
      { id: "LLM", color: "#ff69b4" },
      { id: "ContextBridge", color: "#8b00ff" },
      ...dataSources.map((src) => ({
        id: src.name,
        color: src.status ? "#00ff7f" : "#ff4d4d",
      })),
    ],
    links: [
      { source: "LLM", target: "ContextBridge" },
      ...dataSources.map((src) => ({ source: "ContextBridge", target: src.name })),
    ],
  };

  const handleConnect = () => {
    if (!newSource.type || !newSource.url) return;
    setDataSources([
      ...dataSources,
      { name: newSource.url, type: newSource.type, status: true },
    ]);
    setNewSource({ type: "", url: "", token: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a013f] to-[#2d0064] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <motion.h1
          className="text-3xl font-bold text-center text-pink-300 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🧩 Data Schema — The Connection Map
        </motion.h1>

        {/* Connected Systems Panel */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {dataSources.map((src, i) => (
            <motion.div
              key={i}
              className="bg-white/10 backdrop-blur-xl rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-lg border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {src.type === "SQL" ? <FaDatabase size={24} /> : null}
              {src.type === "API" ? <FaPlug size={24} /> : null}
              {src.type === "File" ? <FaFileAlt size={24} /> : null}
              {src.type === "ERP" ? <FaServer size={24} /> : null}
              {src.type === "CRM" ? <FaDatabase size={24} /> : null}
              <p className="text-sm">{src.name}</p>
              <span
                className={`w-3 h-3 rounded-full ${
                  src.status ? "bg-green-400" : "bg-red-500"
                }`}
              ></span>
            </motion.div>
          ))}
        </div>

        {/* Graph Visualization */}
        <div className="h-[400px] rounded-2xl border border-white/20 shadow-lg bg-white/10 backdrop-blur-xl">
          <ForceGraph2D
            graphData={graphData}
            nodeAutoColorBy="color"
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.id;
              const fontSize = 12 / globalScale;
              ctx.fillStyle = node.color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI, false);
              ctx.fill();
              ctx.font = `${fontSize}px Sans-Serif`;
              ctx.fillStyle = "#fff";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(label, node.x, node.y - 16);
            }}
            linkColor={() => "#8b00ff"}
            linkWidth={2}
            backgroundColor="rgba(26,1,63,0)"
          />
        </div>

        {/* Add New Source Form */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-semibold text-pink-300 mb-4 flex items-center gap-2">
            <FaPlus /> Add New Source
          </h2>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Type (SQL/API/File)"
              value={newSource.type}
              onChange={(e) => setNewSource({ ...newSource, type: e.target.value })}
              className="flex-1 p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <input
              type="text"
              placeholder="URL or Path"
              value={newSource.url}
              onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
              className="flex-1 p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <input
              type="text"
              placeholder="Auth Token (mocked)"
              value={newSource.token}
              onChange={(e) => setNewSource({ ...newSource, token: e.target.value })}
              className="flex-1 p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            <button
              onClick={handleConnect}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2"
            >
              Connect
            </button>
          </div>
        </motion.div>

        {/* Data Preview */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-semibold text-pink-300 mb-4 flex items-center gap-2">
            <FaDatabase /> Data Preview
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-gray-200 border-collapse">
              <thead className="text-gray-400 border-b border-white/20">
                <tr>
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Department</th>
                  <th className="py-2 px-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sampleData.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/10 hover:bg-white/10 transition-all"
                  >
                    <td className="py-2 px-3">{row.id}</td>
                    <td className="py-2 px-3">{row.name}</td>
                    <td className="py-2 px-3">{row.dept}</td>
                    <td className="py-2 px-3">{row.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
