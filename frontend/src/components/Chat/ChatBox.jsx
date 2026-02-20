// src/components/Chat/ChatBox.jsx
import React from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

export default function ChatBox() {
  return (
    <div className="flex flex-col h-full p-4 bg-gray-50">
      <div className="flex-1 overflow-y-auto mb-4">
        <ChatMessage text="Hello! How can I help you today?" sender="bot" />
      </div>
      <ChatInput />
    </div>
  );
}
