import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { Message } from "@/components/message-component";
import { v4 as uuid4 } from "uuid";

export type IntermediateHistoricalMessage = {
  message: string;
  conversationId: number;
  sentAt: number;
  isImage: boolean;
  index: string;
  sender: "user" | "bot";
};

type ChatContextType = {
  messages: Message[];
  setMessages: (state: Message[], message: Message[]) => void;
  addMessage: (message: Message) => void;
  fetchHistory: (conversationId: string) => void;
  isProcessingImage: boolean;
  setIsProcessingImage: (isProcessing: boolean) => void;
};

export const ChatContext = createContext<ChatContextType>({
  messages: [],
  setMessages: () => {},
  addMessage: () => {},
  fetchHistory: () => {},
  isProcessingImage: false,
  setIsProcessingImage: () => {},
});

type ChatProviderProps = {
  children: React.ReactNode;
};

export const ChatProvider = ({ children }: ChatProviderProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
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
    try {
      const response = await axios.get(
        `/api/chatHistory?conversation_id=${conversationId}`,
      );
      const messages = response.data.messages.map(
        (message: IntermediateHistoricalMessage) => {
          return {
            id: uuid4(),
            username: message.sender == "bot" ? "bot" : "some_user",
            message: message.message,
            isImage: message.isImage,
            sentAt: message.sentAt / 1000,
          } as Message;
        },
      );

      setMessages(messages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
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
