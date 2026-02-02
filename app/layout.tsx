import "./globals.css";
import ChatBot from "./components/ChatBot";
import { ReactNode } from "react";
import ConditionalChatBot from "./components/ConditionalChatBot";

import ClientOnly from "./components/ClientOnly";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* 👇 ChatBot only on non-agent pages */}
        <ClientOnly>
          <ConditionalChatBot />
        </ClientOnly>
      </body>
    </html>
  );
}
