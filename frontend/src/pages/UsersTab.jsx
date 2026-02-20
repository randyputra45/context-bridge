// src/pages/tabs/UserTab.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaUserShield, FaEdit, FaTrash, FaPlus } from "react-icons/fa";

export default function UserTab() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roles: "",
  });
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" }); // type: success | error
  const [showForm, setShowForm] = useState(false);

  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/context", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(res.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    const dataToSend = {
      name: formData.name,
      email: formData.email,
      roles: [formData.roles],
      ...(formData.password.trim() && { password: formData.password }),
    };

    try {
      if (editingUser) {
        await axios.patch(
          `http://localhost:3001/api/users/${editingUser._id}`,
          dataToSend,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessage({ text: "✅ User updated successfully!", type: "success" });
      } else {
        await axios.post("http://localhost:3001/api/register", dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage({ text: "✅ User added successfully!", type: "success" });
      }

      setFormData({ name: "", email: "", password: "", roles: "" });
      setEditingUser(null);
      setShowForm(false);
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      setMessage({ text: "❌ Failed to save user.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      roles: user.roles?.[0]?._id || user.roles?.[0] || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`http://localhost:3001/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ text: "✅ User deleted successfully!", type: "success" });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage({ text: "❌ Failed to delete user.", type: "error" });
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

      {/* Add/Edit User Button */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingUser(null);
            setFormData({ name: "", email: "", password: "", roles: "" });
          }}
          className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-xl shadow-md transition text-white"
        >
          <FaPlus /> {showForm ? "Close" : "Add User"}
        </button>
      </div>

      {/* Add/Edit User Form */}
      {showForm && (
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-10 shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 text-pink-300">
            {editingUser ? "✏️ Edit User" : "➕ Add New User"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="p-3 rounded-xl bg-white/10 border border-white/20 focus:ring-2 focus:ring-pink-400 outline-none text-gray-100 placeholder-gray-400"
            />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className="p-3 rounded-xl bg-white/10 border border-white/20 focus:ring-2 focus:ring-pink-400 outline-none text-gray-100 placeholder-gray-400"
            />
            <input
              type="password"
              name="password"
              placeholder="Password (optional)"
              value={formData.password}
              onChange={handleChange}
              className="p-3 rounded-xl bg-white/10 border border-white/20 focus:ring-2 focus:ring-pink-400 outline-none text-gray-100 placeholder-gray-400"
            />
            <select
              name="roles"
              value={formData.roles}
              onChange={handleChange}
              required
              className="p-3 rounded-xl bg-white/10 border border-white/20 focus:ring-2 focus:ring-pink-400 outline-none text-gray-100"
            >
              <option value="">Select Role</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 flex justify-between gap-3">
            {editingUser && (
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setFormData({ name: "", email: "", password: "", roles: "" });
                  setShowForm(false);
                }}
                className="bg-gray-700 hover:bg-gray-800 px-6 py-2 rounded-xl text-gray-200 transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-pink-600 hover:bg-pink-700 px-6 py-2 rounded-xl text-white transition"
            >
              {loading
                ? "Saving..."
                : editingUser
                ? "Update User"
                : "Add User"}
            </button>
          </div>
        </motion.form>
      )}

      {/* Users Table */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-pink-300 flex items-center gap-2">
          <FaUserShield /> Registered Users
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-gray-100 border-collapse">
            <thead className="bg-white/10 text-gray-300 uppercase text-sm">
              <tr>
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="border-b border-white/10 hover:bg-white/10 transition"
                  >
                    <td className="py-2 px-3">{user.name}</td>
                    <td className="py-2 px-3">{user.email}</td>
                    <td className="py-2 px-3 capitalize">
                      {user.roles?.map((r) => r.name || r).join(", ")}
                    </td>
                    <td className="py-2 px-3 text-center flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="px-3 py-1 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-4 text-gray-400 italic"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
