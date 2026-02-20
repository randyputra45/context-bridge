// src/components/UserTable.jsx
import React from "react";

export default function UserTable({ users, onEdit, onDelete }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Users List</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-700 text-left">
            <th className="p-3 border">ID</th>
            <th className="p-3 border">Name</th>
            <th className="p-3 border">Email</th>
            <th className="p-3 border">Role</th>
            <th className="p-3 border text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td
                colSpan="5"
                className="text-center p-6 text-gray-500 italic border"
              >
                No users found.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 border-t transition-all"
              >
                <td className="p-3 border">{user.id}</td>
                <td className="p-3 border">{user.name}</td>
                <td className="p-3 border">{user.email}</td>
                <td className="p-3 border">{user.role}</td>
                <td className="p-3 border text-center space-x-2">
                  <button
                    onClick={() => onEdit(user)}
                    className="bg-yellow-400 text-white px-3 py-1 rounded-lg hover:bg-yellow-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(user.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
