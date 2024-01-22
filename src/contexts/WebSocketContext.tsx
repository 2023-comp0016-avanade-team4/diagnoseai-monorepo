import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { Message } from "@/components/message-component";
import useAuthToken from "@/hooks/use-auth-token";

type WebSocketContextState = {
  wsUrl: string | null;
  messages: Message[];
  addMessage: (message: Message) => void;
  webSocket: WebSocket | null;
};

export const WebSocketContext = createContext<WebSocketContextState>({
  wsUrl: null,
  messages: [],
  addMessage: () => {},
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
  const token = useAuthToken();

  const addMessage = useCallback((message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const data = JSON.stringify({
        userId: "123", // Replace with dynamic user ID if necessary
      });

      const config = {
        method: "post",
        url: "https://diagnoseai-core-apis.azure-api.net/core/chat_connection",
        headers: {
          // 'Ocp-Apim-Subscription-Key': process.env.OCP_APIM_SUBSCRIPTION_KEY,
          "Ocp-Apim-Subscription-Key": "14accc73703e44e2b4ed893edd5fb01b",
          "Content-Type": "application/json",
          "Auth-Token": token,
        },
        data,
      };

      try {
        const response = await axios(config);
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
