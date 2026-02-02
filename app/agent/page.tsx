"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("https://livechat-backend-production.up.railway.app");

export default function AgentPage() {
  const [mounted, setMounted] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState("");

  useEffect(() => setMounted(true), []);

useEffect(() => {
  if (!mounted) return;

  const saved = localStorage.getItem("agent_chat_list");
  if (saved) setChats(JSON.parse(saved));

  socket.on("chat_list", (data) => {
    setChats(data);
    localStorage.setItem("agent_chat_list", JSON.stringify(data));
  });

  return () => {
    socket.off("chat_list"); // ✅ returns void
  };
}, [mounted]);


  if (!mounted) return null;

  const activeChat = chats.find(c => c.userId === activeId);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}>
      <div style={{ width: 300, borderRight: "1px solid #ddd" }}>
        <h3 style={{ padding: 12 }}>Visitors</h3>
        {chats.map(c => (
          <div
            key={c.userId}
            onClick={() => setActiveId(c.userId)}
            style={{
              padding: 10,
              cursor: "pointer",
              background: activeId === c.userId ? "#e0f2fe" : "#fff"
            }}
          >
            {c.status === "online" ? "🟢" : "🔴"} {c.user.name}
            <div style={{ fontSize: 12, color: "#555" }}>
              📄 {c.page} <br />
              💻 {c.device} 🌍 {c.country}
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, padding: 20 }}>
        {activeChat ? (
          <>
            <h3>{activeChat.user.name}</h3>
            <div style={{ height: 300, overflowY: "auto" }}>
              {activeChat.messages.map((m: any, i: number) => (
                <div key={i}>
                  <b>{m.sender}:</b> {m.text}
                </div>
              ))}
            </div>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e =>
                e.key === "Enter" &&
                socket.emit("agent_message", {
                  userId: activeChat.userId,
                  text
                })
              }
            />
          </>
        ) : (
          <p>Select a visitor</p>
        )}
      </div>
    </div>
  );
}
