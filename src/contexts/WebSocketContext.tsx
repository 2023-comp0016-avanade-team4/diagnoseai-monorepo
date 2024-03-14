import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { showToastWithRefresh } from "@/components/toast-with-refresh";

type WebSocketContextState = {
  wsUrl: string | null;
  webSocket: WebSocket | null;
};

export const WebSocketContext = createContext<WebSocketContextState>({
  wsUrl: null,
  webSocket: null,
});

type WebSocketProviderProps = {
  children: React.ReactNode;
};

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post("/api/chatConnection");
        const wsUrl = response.data.wsUrl; // Extract the wsUrl from the response
        setWsUrl(wsUrl);
      } catch (error) {
        console.error("Error fetching WebSocket URL:", error);
        showToastWithRefresh("Error fetching WebSocket URL, please refresh.");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!wsUrl) return;

    let attemptReconnect = true;

    const connectWebSocket = () => {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket Connected");
      };

      ws.onclose = () => {
        if (attemptReconnect) {
          console.log("WebSocket Disconnected. Attempting to reconnect...");
          setTimeout(() => {
            connectWebSocket();
          }, 1000); // wait before reconnecting
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket Error", error);
      };

      setWebSocket(ws);
    };

    connectWebSocket();

    return () => {
      attemptReconnect = false;
      if (webSocket) {
        webSocket.close();
      }
    };
  }, [wsUrl]);

  const contextValue = {
    wsUrl,
    webSocket, // Provide the WebSocket instance in context
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
