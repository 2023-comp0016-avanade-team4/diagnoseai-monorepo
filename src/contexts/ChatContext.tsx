import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { Message, citationObject } from "@/components/message-component";
import { v4 as uuid4 } from "uuid";
import { showToastWithRefresh } from "@/components/toast-with-refresh";

export type IntermediateHistoricalMessage = {
  message: string;
  conversationId: number;
  sentAt: number;
  isImage: boolean;
  index: string;
  sender: "user" | "bot";
  citations: citationObject[];
};

export const ChatContext = createContext({
  messages: [] as Message[],
  setMessages: (_state: Message[], _message: Message[]) => {},
  addMessage: (_message: Message) => {},
  fetchHistory: (_conversationId: string) => {},
});

type ChatProviderProps = {
  children: React.ReactNode;
};

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = useCallback((message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  const fetchHistory = useCallback(async (conversationId: string) => {
    try {
      const response = await axios.get(
        `/api/chatHistory?conversation_id=${conversationId}`
      );
      const messages = response.data.messages.map(
        (message: IntermediateHistoricalMessage) => {
          return {
            id: uuid4(),
            username: message.sender == "bot" ? "bot" : "some_user",
            message: message.message,
            isImage: message.isImage,
            sentAt: message.sentAt / 1000,
            citations: message.citations,
          } as Message;
        }
      );

      setMessages(messages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      showToastWithRefresh("Error fetching chat history, please refresh.");
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{ messages, setMessages, addMessage, fetchHistory }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatProvider = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatProvider must be used within a ChatProvider");
  }
  return context;
};
