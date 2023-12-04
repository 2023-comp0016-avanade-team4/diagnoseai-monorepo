import React, { createContext, useContext, useState, useEffect, FC } from 'react';
import axios from 'axios';

export type Message = {
  id: string;
  username: string;
  avatar?: string;
  body: string;
  createdAt: string;
};


type WebSocketContextState = {
  wsUrl: string | null;
  messages: Message[];
  addMessage: (message: Message) => void;
};

export const WebSocketContext = createContext<WebSocketContextState>({
  wsUrl: null,
  messages: [],
  addMessage: () => {},
});

type WebSocketProviderProps = {
  children: React.ReactNode;
};

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // add a new message to the state
  const addMessage = (message: Message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = JSON.stringify({
        "userId": "123" // Replace with dynamic user ID if necessary
      });

      const config = {
        method: 'post',
        url: 'https://diagnoseai-core-apis.azure-api.net/core/chat_connection',
        headers: { 
          // 'Ocp-Apim-Subscription-Key': process.env.OCP_APIM_SUBSCRIPTION_KEY, 
          'Ocp-Apim-Subscription-Key': "key here", 
          'Content-Type': 'application/json'
        },
        data: data
      };

      console.log(config);
      try {
        const response = await axios(config);
        const wsUrl = response.data.wsUrl; // Extract the wsUrl from the response
        setWsUrl(wsUrl);
      } catch (error) {
        console.error('Error fetching WebSocket URL:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (wsUrl) {
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const messageData: Message = JSON.parse(event.data);
          addMessage(messageData); // Add the received message to the state
        } catch (error) {
          console.error("Error parsing message data:", error);
        }
      };

      // Clean up the WebSocket on unmount or wsUrl change
      return () => ws.close();
    }
  }, [wsUrl]);

  // Provide wsUrl, messages, and addMessage to the context
  return (
    <WebSocketContext.Provider value={{ wsUrl, messages, addMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use the WebSocket context
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
