"use client";

import { usePathname } from "next/navigation";
import ChatBot from "./ChatBot";

export default function ConditionalChatBot() {
  const pathname = usePathname();

  // Hide chatbot on agent routes
  if (pathname.startsWith("/agent")) {
    return null;
  }

  return <ChatBot />;
}
