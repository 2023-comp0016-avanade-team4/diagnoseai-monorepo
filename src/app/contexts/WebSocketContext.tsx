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
  }, [webSocket])

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
    if (wsUrl && !webSocket) {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsReady(true);
      }

      ws.onmessage = (event) => {
        try {
          const messageData: Message = JSON.parse(event.data);
          addMessage(messageData);
        } catch (error) {
          console.error("Error parsing message data:", error);
        }
      };

      setWebSocket(ws);
    }

    return () => {
      if (webSocket) {
        webSocket.close(); // Clean up the WebSocket on unmount
      }
    };
  }, [wsUrl, webSocket, addMessage]);

  const contextValue = {
    wsUrl,
    messages,
    addMessage,
    isSocketReady: isReady,
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
