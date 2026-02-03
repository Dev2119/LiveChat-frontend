"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type Message = {
  id: number;
  sender: "user" | "agent";
  text: string;
};

let socket: Socket | null = null;

function getDevice() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mobile")) return "Mobile";
  return "Desktop";
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // ✅ guard for browser
    if (typeof window === "undefined") return;

    // ✅ get userId safely
    let userId = localStorage.getItem("livechat_user_id");
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem("livechat_user_id", userId);
    }

    // ✅ init socket ONCE
    if (!socket) {
      const url = process.env.NEXT_PUBLIC_SOCKET_URL;
      if (!url) {
        console.error("❌ NEXT_PUBLIC_SOCKET_URL missing");
        return;
      }

      socket = io(url, {
        transports: ["websocket"]
      });
    }

    if (!startedRef.current) {
      socket.emit("start_chat", {
        userId,
        name: "Guest"
      });

      socket.emit("user_activity", {
        userId,
        page: window.location.pathname,
        device: getDevice()
      });

      const handleRouteChange = () => {
        socket?.emit("user_activity", {
          userId,
          page: window.location.pathname,
          device: getDevice()
        });
      };

      window.addEventListener("popstate", handleRouteChange);

      startedRef.current = true;

      return () => {
        window.removeEventListener("popstate", handleRouteChange);
        socket?.disconnect(); // ✅ cleanup
        socket = null;
      };
    }

    socket.on("chat_history", setMessages);

    socket.on("agent_reply", (text: string) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: "agent", text }
      ]);
    });

    return () => {
      socket?.off("chat_history");
      socket?.off("agent_reply");
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    if (!input.trim() || !socket) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "user", text: input }
    ]);

    socket.emit("user_message", input);
    setInput("");
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "#2563eb",
          color: "#fff",
          fontSize: 24,
          border: "none",
          cursor: "pointer",
          zIndex: 9999
        }}
      >
        💬
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 20,
            width: 340,
            height: 460,
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 10px 30px rgba(0,0,0,.3)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9999
          }}
        >
          <div style={{ padding: 12, background: "#111827", color: "#fff" }}>
            Live Support
          </div>

          <div style={{ flex: 1, padding: 12, overflowY: "auto" }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  textAlign: m.sender === "user" ? "right" : "left",
                  marginBottom: 8
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "8px 12px",
                    borderRadius: 14,
                    background:
                      m.sender === "user" ? "#2563eb" : "#e5e7eb",
                    color: m.sender === "user" ? "#fff" : "#000"
                  }}
                >
                  {m.text}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={{ display: "flex", padding: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type message..."
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 8,
                border: "1px solid #ccc"
              }}
            />
            <button onClick={send} style={{ marginLeft: 6 }}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
