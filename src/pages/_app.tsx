import React from "react";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { WorkOrderProvider } from "@/contexts/WorkOrderContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ClerkProvider } from "@clerk/nextjs";

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <ClerkProvider {...pageProps}>
      <ChatProvider>
        <WebSocketProvider>
          <WorkOrderProvider>
            <Component {...pageProps} />
          </WorkOrderProvider>
        </WebSocketProvider>
      </ChatProvider>
    </ClerkProvider>
  );
};

export default App;
