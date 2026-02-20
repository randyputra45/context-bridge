// src/components/UserForm.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserForm({ onSave, selectedUser, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password_hash: "",
    role: "user",
  });
  const [message, setMessage] = useState({ text: "", type: "" }); // type: 'success' | 'error'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedUser) setFormData(selectedUser);
  }, [selectedUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      await onSave(formData); // assuming onSave returns a promise
      setMessage({
        text: selectedUser
          ? "✅ User updated successfully!"
          : "✅ User added successfully!",
        type: "success",
      });
      setFormData({ name: "", email: "", password_hash: "", role: "user" });
    } catch (err) {
      console.error(err);
      setMessage({
        text: selectedUser
          ? "❌ Failed to update user."
          : "❌ Failed to add user.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-lg mb-6 max-w-2xl"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          {selectedUser ? "Edit User" : "Add New User"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="p-3 border rounded-lg focus:ring focus:ring-blue-200"
            required
          />
          <input
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="p-3 border rounded-lg focus:ring focus:ring-blue-200"
            required
          />
          {!selectedUser && (
            <input
              name="password_hash"
              type="password"
              placeholder="Password"
              value={formData.password_hash}
              onChange={handleChange}
              className="p-3 border rounded-lg focus:ring focus:ring-blue-200"
              required
            />
          )}
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="p-3 border rounded-lg focus:ring focus:ring-blue-200"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-all"
          >
            {loading ? "Saving..." : selectedUser ? "Update" : "Add"}
          </button>
          {selectedUser && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-400 text-white px-5 py-2 rounded-lg hover:bg-gray-500 transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Success/Error Message */}
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
    </>
  );
}
