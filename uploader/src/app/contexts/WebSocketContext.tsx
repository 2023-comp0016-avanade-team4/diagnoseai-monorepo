import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { Message } from "../components/MessageComponent";

type WebSocketContextState = {
  wsUrl: string | null;
  messages: Message[];
  addMessage: (message: Message) => void;
  isSocketReady: boolean;
  webSocket: WebSocket | null;
};

export const WebSocketContext = createContext<WebSocketContextState>({
  wsUrl: null,
  messages: [],
  addMessage: () => {},
  isSocketReady: false,
  webSocket: null,
});

type WebSocketProviderProps = {
  children: React.ReactNode;
};

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [isReady, setIsReady] = useState(false);

  const addMessage = useCallback((message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  useEffect(() => {
    // Whenever the websocket object changes, we are either reconnecting
    // or cleaning up the websocket
    setIsReady(false);
  }, [webSocket]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post("/api/chatConnection");
        const wsUrl = response.data.wsUrl;
        setWsUrl(wsUrl);
      } catch (error) {
        console.error("Error fetching WebSocket URL:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let attemptReconnect = true;
    if (!wsUrl) {
      return;
    }

    const connectWebSocket = () => {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsReady(true);
      };

      ws.onclose = () => {
        if (attemptReconnect) {
          console.log("WebSocket Disconnected. Attempting to reconnect...");
          setTimeout(() => {
            connectWebSocket();
          }, 1000);
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
  }, [wsUrl, addMessage]); // intentional: we don't include webSocket

  const contextValue = {
    wsUrl,
    messages,
    addMessage,
    isSocketReady: isReady,
    webSocket,
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
