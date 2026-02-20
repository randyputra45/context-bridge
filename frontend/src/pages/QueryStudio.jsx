import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import { Play, Trash2, Download, Database, Terminal } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useAsyncError } from "react-router-dom";

export default function QueryStudio() {
  const [query, setQuery] = useState("");
  const [llmAnswer, setLlmAnswer] = useState("");
  const [placeholder_, setPlaceholder] = useState("e.g Department in the university");

  const [citations, setCitations] = useState([]); // ✅ new state for citations
  const [trace, setTrace] = useState({ trace_id: "", elapsed_ms: 0 }); // ✅ new state for trace
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState("answer");
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  const examplePrompts = [
    "tell me about Statistical Analysis subject",
    "how many ECTS in SUB002: Data Structures subject",
  ];

  const handleExecute = async (customQuery) => {
    const q = customQuery || query;
    if (!q.trim()) return alert("Please enter a query.");

    try {
      setLoading(true);
      setShowResults(false);
      setLlmAnswer("");
      setCitations([]);
      setTrace({ trace_id: "", elapsed_ms: 0 });

      const start = Date.now(); // fallback if backend doesn’t send elapsed_ms

      // 🔹 Step 1: Send query to backend
      const res = await axios.post(
        "http://localhost:3001/api/query",
        { id: user._id, query: q },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 🔹 Step 2: Extract response data
      const data = res.data;

      // 🔹 Step 3: Update UI
      setLlmAnswer(data.answer || "No answer generated.");
      setCitations(data.citations || []);
      setTrace({
        trace_id: data.trace_id || "",
        elapsed_ms: data.elapsed_ms || Date.now() - start,
      });

      setShowResults(true);
      setActiveTab("answer");
    } catch (error) {
      console.error("Query failed:", error);
      alert("Something went wrong: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setLlmAnswer("");
    setCitations([]);
    setTrace({ trace_id: "", elapsed_ms: 0 });
    setShowResults(false);
    setActiveTab("answer");
  };

  const tabs = [
    { id: "answer", label: "Answer", icon: <Database className="w-5 h-5 text-teal-400" /> },
    { id: "data", label: "Data Sources", icon: <Download className="w-5 h-5 text-orange-400" /> },
    { id: "trace", label: "Trace", icon: <Terminal className="w-5 h-5 text-yellow-400" /> },
  ];

  // ✅ Format current execution time
  const currentDateTime = new Date().toLocaleString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a013f] to-[#2d0064] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xl font-semibold mb-6 text-left text-pink-300 flex items-center gap-2"
        >
          ⚙️ <span>Query Studio — Playground for Data + AI</span>
        </motion.h1>

        {/* Ask Panel */}
        <motion.div
          className="bg-white/10 backdrop-blur-2xl rounded-3xl p-5 shadow-xl border border-white/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg md:text-xl font-semibold mb-3 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" /> Ask Anything
          </h2>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder_}
              className="flex-1 p-4 rounded-2xl bg-white/10 border border-white/20 placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-md transition"
            />

            <div className="flex gap-2 mt-2 md:mt-0">
              <button
                onClick={() => handleExecute()}
                disabled={loading}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 transition rounded-2xl px-5 py-2 font-medium shadow-lg"
              >
                <Play size={16} /> {loading ? "Running Query..." : "Run Query"}
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition rounded-2xl px-5 py-2 font-medium shadow-lg"
              >
                <Trash2 size={16} /> Clear
              </button>
            </div>
          </div>

          {/* Example Prompts */}
          <div className="mt-3 flex flex-wrap gap-2">
            {examplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => {setPlaceholder(examplePrompts[i]); handleExecute(p)}}
                className="px-3 py-1 bg-purple-600/20 hover:bg-purple-500/30 rounded-full text-purple-200 text-sm font-medium transition shadow-sm"
              >
                {p}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tabs Section */}
        {showResults && (
          <motion.div
            className="bg-white/10 backdrop-blur-2xl rounded-3xl p-5 shadow-xl border border-white/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Tabs */}
            <div className="flex border-b border-white/20 mb-4 text-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-4 py-2 -mb-px font-semibold text-sm md:text-base border-b-2 transition ${
                    activeTab === tab.id
                      ? "border-teal-400 text-white"
                      : "border-transparent text-gray-400 hover:text-white hover:border-teal-400"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "answer" && (
              <div className="space-y-4">
                <h3 className="text-md md:text-lg font-semibold text-teal-400 flex items-center gap-2 mb-1">
                  <Database className="w-5 h-5" /> Answer
                </h3>
                <pre className="whitespace-pre-wrap text-sm text-gray-200 p-3 bg-white/5 rounded-xl shadow-inner">
                  {llmAnswer}
                </pre>
              </div>
            )}

            {activeTab === "data" && (
              <div className="space-y-3">
                <h3 className="text-md md:text-lg font-semibold text-orange-400 mb-1 flex items-center gap-2">
                  <Download className="w-5 h-5" /> Data Sources
                </h3>

                {citations.length > 0 ? (
                  <ul className="list-disc ml-5 text-gray-200 space-y-1 text-sm">
                    {citations.map((c, i) => (
                      <li key={i} className="break-all">
                        <span className="font-semibold text-orange-300">{c.source}</span> →{" "}
                        <span className="text-gray-300">{c.file}</span>{" "}
                        <span className="text-gray-400 text-xs">({c.loc})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-sm">No citations available.</p>
                )}
              </div>
            )}

            {activeTab === "trace" && (
              <div className="space-y-2">
                <h3 className="text-md md:text-lg font-semibold text-yellow-400 mb-1 flex items-center gap-2">
                  <Terminal className="w-5 h-5" /> Trace Information
                </h3>
                <p className="text-gray-200 text-sm">
                  Query executed on{" "}
                  <span className="font-semibold">{currentDateTime}</span>
                </p>
                <p className="text-gray-200 text-sm">
                  Elapsed time:{" "}
                  <span className="font-semibold">{trace.elapsed_ms} ms</span>
                </p>
                {trace.trace_id && (
                  <p className="text-gray-400 text-xs">
                    Trace ID: <span className="font-mono">{trace.trace_id}</span>
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
