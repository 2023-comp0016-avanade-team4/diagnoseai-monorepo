import React from "react";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { WorkOrderProvider } from "@/contexts/WorkOrderContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastContainer } from "react-toastify";
import Head from "next/head";

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <ClerkProvider {...pageProps}>
      <ChatProvider>
        <WebSocketProvider>
          <WorkOrderProvider>
            <Head>
              <title>DiagnoseAI WebApp</title>
              <meta property="og:title" content="My page title" key="title" />
            </Head>
            <Component {...pageProps} />
            <ToastContainer />
          </WorkOrderProvider>
        </WebSocketProvider>
      </ChatProvider>
    </ClerkProvider>
  );
};

export default App;
