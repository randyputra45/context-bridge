// src/components/Chat/ChatMessage.jsx
import React from "react";

export default function ChatMessage({ text, sender }) {
  return (
    <div className={`p-2 my-2 rounded-lg ${sender === "bot" ? "bg-blue-100 self-start" : "bg-green-100 self-end"}`}>
      {text}
    </div>
  );
}
