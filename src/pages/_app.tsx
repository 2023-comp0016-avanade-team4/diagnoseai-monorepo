import React from "react";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { ClerkProvider } from "@clerk/nextjs";

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <ClerkProvider {...pageProps}>
      <WebSocketProvider>
        <Component {...pageProps} />
      </WebSocketProvider>
    </ClerkProvider>
  );
};

export default App;
