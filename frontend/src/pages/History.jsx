import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch, FaDownload, FaEye } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function History() {
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);

  const token = localStorage.getItem("access_token"); // adjust if stored differently

  const fetchHistory = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/traces", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data || []);
    } catch (error) {
      console.error("❌ Error fetching history:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log?.query?.toLowerCase().includes(search.toLowerCase()) ||
      log?.user?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a013f] to-[#2d0064] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.h1
          className="text-3xl font-bold text-center text-pink-300 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          📜 History — The Audit Trail
        </motion.h1>

        {/* Search Bar */}
        <div className="flex gap-2 items-center mb-4">
          <input
            type="text"
            placeholder="Search by user or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-white/10 border border-white/20 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <FaSearch className="text-pink-300 w-6 h-6" />
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-200 border-collapse">
            <thead className="text-gray-400 border-b border-white/20">
              <tr>
                <th className="py-2 px-3">User</th>
                <th className="py-2 px-3">Query</th>
                <th className="py-2 px-3">Model</th>
                <th className="py-2 px-3">Sources</th>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Duration</th>
                <th className="py-2 px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-gray-400">
                    No logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, i) => {
                  const sources =
                    log.citations && log.citations.length > 0
                      ? [
                          ...new Set(
                            log.citations.map((c) => c.source || "Unknown Source")
                          ),
                        ]
                            .slice(0, 3)
                            .join(", ") +
                        (log.citations.length > 3 ? "..." : "")
                      : "—";

                  return (
                    <tr
                      key={log.trace_id || i}
                      className="border-b border-white/10 hover:bg-white/10 transition-all"
                    >
                      <td className="py-2 px-3">{log.user || "Anonymous"}</td>
                      <td className="py-2 px-3 truncate max-w-xs">{log.query}</td>
                      <td className="py-2 px-3">{log.model || "—"}</td>
                      <td className="py-2 px-3">{sources}</td>
                      <td className="py-2 px-3">
                        {new Date(log.ts).toLocaleString()}
                      </td>
                      <td className="py-2 px-3">{log.elapsed_ms / 1000}s</td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="flex items-center gap-1 bg-pink-500 hover:bg-pink-600 px-3 py-1 rounded-lg text-white text-sm"
                        >
                          <FaEye /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal for Log Details */}
        <AnimatePresence>
          {selectedLog && (
            <motion.div
              className="fixed inset-0 bg-black/60 flex justify-center items-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
            >
              <motion.div
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-3xl w-full text-gray-100 relative overflow-y-auto max-h-[90vh]"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl font-bold text-pink-300 mb-4">
                  🔍 Query Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400">User:</p>
                    <p className="p-3 bg-black/20 rounded-lg">
                      {selectedLog.user || "Anonymous"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Query:</p>
                    <p className="p-3 bg-black/20 rounded-lg">{selectedLog.query}</p>
                  </div>

                  <div>
                    <p className="text-gray-400">Model Used:</p>
                    <p className="p-3 bg-black/20 rounded-lg">
                      {selectedLog.model || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">AI Answer:</p>
                    <p className="p-3 bg-black/20 rounded-lg whitespace-pre-wrap">
                      {selectedLog.answer || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Context Snapshot:</p>
                    <pre className="bg-black/20 p-3 rounded-lg whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {selectedLog.context || "—"}
                    </pre>
                  </div>

                  <div>
                    <p className="text-gray-400">Citations:</p>
                    <div className="space-y-2 p-3 bg-black/20 rounded-lg max-h-64 overflow-y-auto">
                      {selectedLog.citations?.map((c, i) => (
                        <div
                          key={i}
                          className="border-b border-white/10 pb-2 last:border-0"
                        >
                          <p>
                            <span className="text-pink-300 font-semibold">
                              Source:
                            </span>{" "}
                            {c.source}
                          </p>
                          {c.file && (
                            <p>
                              <span className="text-pink-300 font-semibold">
                                File:
                              </span>{" "}
                              {c.file}
                            </p>
                          )}
                          {c.loc && (
                            <p>
                              <span className="text-pink-300 font-semibold">
                                Location:
                              </span>{" "}
                              {c.loc}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400">Timestamp:</p>
                    <p className="p-3 bg-black/20 rounded-lg">
                      {new Date(selectedLog.ts).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Processing Time:</p>
                    <p className="p-3 bg-black/20 rounded-lg">
                      {selectedLog.elapsed_ms / 1000}s
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => alert("Download report (mocked)!")}
                  className="mt-5 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
                >
                  <FaDownload /> Download Report
                </button>

                <button
                  onClick={() => setSelectedLog(null)}
                  className="absolute top-4 right-4 text-gray-300 hover:text-white font-bold"
                >
                  ✕
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
