// src/components/Chat/ChatInput.jsx
import React, { useState } from "react";

export default function ChatInput() {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    console.log("Message sent:", message);
    setMessage("");
  };

  return (
    <div className="flex gap-2">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 border p-2 rounded-lg"
      />
      <button onClick={handleSend} className="bg-blue-500 text-white px-4 py-2 rounded-lg">
        Send
      </button>
    </div>
  );
}
