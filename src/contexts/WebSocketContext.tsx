import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import axios from "axios";
import useAuthToken from "@/hooks/use-auth-token";

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
  const token = useAuthToken();

  useEffect(() => {
    const fetchData = async () => {
      const data = {
        token: token,
      };

      try {
        const response = await axios.post("/api/chatConnection", data);
        const wsUrl = response.data.wsUrl; // Extract the wsUrl from the response
        setWsUrl(wsUrl);
      } catch (error) {
        console.error("Error fetching WebSocket URL:", error);
      }
    };

    fetchData();
  }, [token]);

  useEffect(() => {
    if (wsUrl && !webSocket) {
      const ws = new WebSocket(wsUrl);
      setWebSocket(ws);
    }

    return () => {
      if (webSocket) {
        webSocket.close();
      }
    };
  }, [wsUrl, webSocket]);

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
