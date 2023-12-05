import React from 'react';
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { WebSocketProvider } from "@/contexts/WebSocketContext";

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <WebSocketProvider>
      <Component {...pageProps} />
    </WebSocketProvider>
  );
};

export default App;
