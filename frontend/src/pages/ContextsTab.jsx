import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

export default function ContextsTab() {
  const [contexts, setContexts] = useState([]);
  const [formData, setFormData] = useState({});
  const [editingContext, setEditingContext] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" }); // success | error

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchContexts();
  }, []);

  const fetchContexts = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/context", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContexts(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      if (editingContext) {
        await axios.patch(
          `http://localhost:3001/api/context/${editingContext._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage({ text: "✅ Context updated successfully!", type: "success" });
      } else {
        await axios.post("http://localhost:3001/api/context", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage({ text: "✅ Context added successfully!", type: "success" });
      }
      fetchContexts();
      setShowForm(false);
      setEditingContext(null);
      setFormData({});
    } catch (error) {
      console.error(error);
      setMessage({ text: "❌ Failed to save context.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (context) => {
    setEditingContext(context);
    setFormData({ name: context.name });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;

    try {
      await axios.delete(`http://localhost:3001/api/context/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ text: "✅ Context deleted successfully!", type: "success" });
      fetchContexts();
    } catch (error) {
      console.error(error);
      setMessage({ text: "❌ Failed to delete context.", type: "error" });
    }
  };

  return (
    <div>
      {/* Alert Message */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            key="crud-message"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`max-w-2xl mb-4 p-3 rounded-lg font-medium ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-xl mb-4"
      >
        {showForm ? "Close" : "Add Context"}
      </button>

      {showForm && (
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6 shadow-lg"
        >
          <input
            type="text"
            name="name"
            placeholder="Context Name"
            value={formData.name || ""}
            onChange={handleChange}
            required
            className="p-3 rounded-xl bg-white/10 border border-white/20 text-gray-100 placeholder-gray-400 w-full"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-pink-600 hover:bg-pink-700 px-6 py-2 rounded-xl text-white"
          >
            {editingContext ? "Update" : "Add"}
          </button>
        </motion.form>
      )}

      <table className="w-full text-left text-gray-100 border-collapse">
        <thead className="bg-white/10 text-gray-300 uppercase text-sm">
          <tr>
            <th className="py-2 px-3">Name</th>
            <th className="py-2 px-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contexts.map((c) => (
            <tr key={c._id} className="border-b border-white/10 hover:bg-white/10">
              <td className="py-2 px-3">{c.name}</td>
              <td className="py-2 px-3 flex gap-2">
                <button
                  onClick={() => handleEdit(c)}
                  className="px-3 py-1 bg-yellow-400 text-white rounded-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c._id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
