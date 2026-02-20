import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock } from "react-icons/fa";
import { motion } from "framer-motion";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success) throw new Error("Login failed");

      const userData = data.data.user;
      const isAdmin = userData.roles.includes("Admin");
      login({ ...userData, isAdmin });

      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (err) {
      setLoading(false);
      alert(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1a013f] to-[#2d0064]">
      <motion.form
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/10  border border-white/20 p-10 w-96 flex flex-col items-center"
        onSubmit={handleSubmit}
      >
        {/* Logo */}
        <img
          src="qantara-white-2.png"
          alt="ContextBridge Logo"
          className="w-100 h-80 mb-4 rounded-full shadow-lg object-contain"
        />

        {/* <h2 className="text-3xl font-bold text-pink-300 mb-8 text-center">
          ContextBridge Login
        </h2> */}

        <div className="relative w-full mb-6">
          <FaUser className="absolute top-3 left-3 text-gray-400" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/20 border border-white/30 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-white"
            required
          />
        </div>

        <div className="relative w-full mb-8">
          <FaLock className="absolute top-3 left-3 text-gray-400" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/20 border border-white/30 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 text-white"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-pink-500 hover:bg-pink-600 transition-colors rounded-xl font-semibold text-white flex justify-center items-center gap-2"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </motion.form>
    </div>
  );
}
