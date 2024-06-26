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

export type ChatContextType = {
  messages: Message[];
  setMessages: (state: Message[], message: Message[]) => void;
  addMessage: (message: Message) => void;
  fetchHistory: (conversationId: string) => void;
  isProcessingImage: boolean;
  setIsProcessingImage: (isProcessing: boolean) => void;
  isProviderBusy: boolean;
};

export const ChatContext = createContext<ChatContextType>({
  messages: [],
  setMessages: () => {},
  addMessage: () => {},
  fetchHistory: () => {},
  isProcessingImage: false,
  setIsProcessingImage: () => {},
  isProviderBusy: false,
});

type ChatProviderProps = {
  children: React.ReactNode;
};

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProviderBusy, setIsProviderBusy] = useState(false); // for frontend spinners
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const addMessage = useCallback((newMessage: Message) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      if (lastMessage && lastMessage.message === "Processing image...") {
        // Remove the last message and add the new one
        setIsProcessingImage(false);
        return [...prevMessages.slice(0, prevMessages.length - 1), newMessage];
      } else {
        return [...prevMessages, newMessage];
      }
    });
  }, []);

  const fetchHistory = useCallback(async (conversationId: string) => {
    setIsProviderBusy(true);
    try {
      const response = await axios.get(
        `/api/chatHistory?conversation_id=${conversationId}`,
      );
      const messages = response.data.messages.map(
        (message: IntermediateHistoricalMessage) => {
          return {
            id: uuid4(),
            username: message.sender,
            message: message.message,
            isImage: message.isImage,
            sentAt: message.sentAt / 1000,
            citations: message.citations,
          } as Message;
        },
      );

      setMessages(messages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      showToastWithRefresh("Error fetching chat history, please refresh.");
    }
    setIsProviderBusy(false);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        addMessage,
        fetchHistory,
        isProcessingImage,
        setIsProcessingImage,
        isProviderBusy,
      }}
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
