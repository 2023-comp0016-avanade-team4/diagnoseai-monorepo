import React, { useContext, useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { WebSocketContext } from "@/contexts/WebSocketContext";
import { ChatContext } from "@/contexts/ChatContext";
import { useWorkOrder } from "@/contexts/WorkOrderContext";
import { MessageComponent, Message } from "@/components/message-component";
import { v4 as uuidv4 } from "uuid";

export type IntermediateResponseMessage = {
  body: string;
  conversationId: number;
  sentAt: number;
  type: "message";
};

export const MessageList = () => {
  const [scrollRef, inView, entry] = useInView({
    trackVisibility: true,
    delay: 1000,
  });
  const { webSocket } = useContext(WebSocketContext);
  const { messages, addMessage, fetchHistory } = useContext(ChatContext);
  const { current } = useWorkOrder();

  useEffect(() => {
    if (entry?.target) {
      entry.target.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages?.length, entry?.target]);

  useEffect(() => {
    const handleIncomingMessages = (event: MessageEvent) => {
      try {
        const messageData = JSON.parse(
          JSON.parse(event.data) as string,
        ) as IntermediateResponseMessage;
        if (
          current?.conversation_id !== messageData.conversationId.toString()
        ) {
          return;
        }

        const responseMessage = {
          id: uuidv4(),
          username: "bot",
          message: messageData.body,
          sentAt: messageData.sentAt / 1000,
        } as Message;

        addMessage(responseMessage);
      } catch (error) {
        console.error("Error parsing message data:", error);
      }
    };

    if (webSocket) {
      webSocket.addEventListener("message", handleIncomingMessages);
      fetchHistory(current ? current?.conversation_id : "1"); // HACK: fallback to 1 if we can't get convesation ID

      return () => {
        webSocket.removeEventListener("message", handleIncomingMessages);
      };
    }
  }, [addMessage, webSocket, fetchHistory, current]);

  if (false)
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white">Fetching most recent chat messages.</p>
      </div>
    );

  if (false)
    return (
      <p className="text-white">SomeThing went wrong. Refresh to try again.</p>
    );

  return (
    <div className="flex flex-col w-full space-y-3 overflow-y-scroll no-scrollbar">
      {!inView && messages?.length && (
        <div className="py-1.5 w-full px-3 z-10 text-xs absolute flex justify-center bottom-0 mb-[120px] inset-x-0">
          <button
            className="py-1.5 px-3 text-xs bg-[#1c1c1f] border border-[#363739] rounded-full text-white font-medium"
            onClick={() => {
              entry?.target.scrollIntoView({
                behavior: "smooth",
                block: "end",
              });
            }}
          >
            Scroll to see latest messages
          </button>
        </div>
      )}
      {messages.map((message) => (
        <MessageComponent key={message?.id} message={message} />
      ))}
      <div ref={scrollRef} />
    </div>
  );
};

export default MessageList;
