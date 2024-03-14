import React from "react";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { WorkOrderProvider } from "@/contexts/WorkOrderContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastContainer } from "react-toastify";

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <ClerkProvider {...pageProps}>
      <ChatProvider>
        <WebSocketProvider>
          <WorkOrderProvider>
            {/* <div className="h-full"> */}
            <Component {...pageProps} />
            <ToastContainer className={"absolute"} />
            {/* </div> */}
          </WorkOrderProvider>
        </WebSocketProvider>
      </ChatProvider>
    </ClerkProvider>
  );
};

export default App;
