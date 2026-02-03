"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type Chat = {
  userId: string;
  user: { name: string };
  messages: { sender: string; text: string }[];
  status: "online" | "offline";
  page?: string;
  device?: string;
  country?: string;
};

export default function AgentPage() {
  const socketRef = useRef<Socket | null>(null);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState("");

  /* ================= SOCKET INIT ================= */
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL!;
    const socket = io(url, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.emit("agent_join");

    // Full chat list (initial + updates)
    socket.on("chat_list", (data: Chat[]) => {
      setChats(data);
      localStorage.setItem("agent_chat_list", JSON.stringify(data));
    });

    // New incoming message (user or agent)
    socket.on("new_message", ({ userId, message }) => {
      setChats((prev) =>
        prev.map((c) =>
          c.userId === userId
            ? { ...c, messages: [...c.messages, message] }
            : c
        )
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const activeChat = chats.find((c) => c.userId === activeId);

  /* ================= SEND MESSAGE ================= */
  function sendMessage() {
    if (!text.trim() || !activeChat || !socketRef.current) return;

    socketRef.current.emit("agent_message", {
      userId: activeChat.userId,
      text
    });

    // Optimistic UI update (instant)
    setChats((prev) =>
      prev.map((c) =>
        c.userId === activeChat.userId
          ? {
              ...c,
              messages: [...c.messages, { sender: "agent", text }]
            }
          : c
      )
    );

    setText("");
  }

  /* ================= UI ================= */
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* LEFT: VISITORS */}
      <div style={{ width: 300, borderRight: "1px solid #ddd" }}>
        <h3 style={{ padding: 12 }}>Visitors</h3>

        {chats.map((c) => (
          <div
            key={c.userId}
            onClick={() => setActiveId(c.userId)}
            style={{
              padding: 10,
              cursor: "pointer",
              background: activeId === c.userId ? "#e0f2fe" : "#fff",
              borderBottom: "1px solid #eee"
            }}
          >
            {c.status === "online" ? "🟢" : "🔴"} {c.user.name}
            <div style={{ fontSize: 12, color: "#555" }}>
              📄 {c.page || "-"} <br />
              💻 {c.device || "-"} 🌍 {c.country || "-"}
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT: CHAT */}
      <div style={{ flex: 1, padding: 20 }}>
        {activeChat ? (
          <>
            <h3>Chat with {activeChat.user.name}</h3>

            <div
              style={{
                height: "60vh",
                border: "1px solid #ddd",
                padding: 10,
                overflowY: "auto",
                marginBottom: 10
              }}
            >
              {activeChat.messages.map((m, i) => (
                <div key={i}>
                  <b>{m.sender}:</b> {m.text}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Reply…"
                style={{ flex: 1, padding: 8 }}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <p>Select a visitor</p>
        )}
      </div>
    </div>
  );
}
