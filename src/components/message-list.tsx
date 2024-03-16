import React, { useContext, useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { WebSocketContext } from "@/contexts/WebSocketContext";
import { ChatContext } from "@/contexts/ChatContext";
import { useWorkOrder } from "@/contexts/WorkOrderContext";
import {
  MessageComponent,
  Message,
  citationObject,
} from "@/components/message-component";
import { v4 as uuidv4 } from "uuid";
import { showToastWithRefresh } from "./toast-with-refresh";
import { Spinner } from "@nextui-org/react";
import { nextTick } from "process";

export type IntermediateResponseMessage = {
  body: string;
  conversationId: number;
  sentAt: number;
  citations: citationObject[];
  type: "message";
};

export const MessageList = () => {
  const [scrollRef, inView, entry] = useInView({
    trackVisibility: true,
    delay: 1000,
  });
  const { webSocket } = useContext(WebSocketContext);
  const { messages, addMessage, fetchHistory, isProviderBusy } = useContext(ChatContext);
  const { current } = useWorkOrder();

  // First Render: teleport to the bottom
  useEffect(() => {
    setTimeout(() => {
      entry?.target?.scrollIntoView({
        block: "start",
        inline: "start",
      });
    })

  }, [entry?.target]);

  // Second Render onwards: Smooth scroll
  useEffect(() => {
    setTimeout(() => {
      entry?.target?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "start",
      });
    })
  }, [messages?.length, entry?.target]);

  useEffect(() => {
    const handleIncomingMessages = (event: MessageEvent) => {
      try {
        const messageData = JSON.parse(
          JSON.parse(event.data) as string
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
          citations: messageData.citations,
        } as Message;

        addMessage(responseMessage);
      } catch (error) {
        console.error("Error parsing message data:", error);
        showToastWithRefresh("Error parsing message data, please refresh.");
      }
    };

    if (webSocket) {
      webSocket.addEventListener("message", handleIncomingMessages);

      if (current) fetchHistory(current?.conversation_id);
      else console.log("Have not received conversation ID yet, skipping history");

      return () => {
        webSocket.removeEventListener("message", handleIncomingMessages);
      };
    }
  }, [addMessage, webSocket, fetchHistory, current]);

  if (!isProviderBusy && messages?.length == 0) {
    return (<div className="flex h-full w-full items-center justify-center" >
      <div className="h-full w-full justify-center gap-5 flex flex-col" role="no-messages">
        <p className="text-white text-center">No messages! Chat with DiagnoseAI to get started</p>
      </div>
    </div>)
  }

  if (isProviderBusy) {
    return (<div className="flex h-full w-full items-center justify-center" >
      <div className="h-full w-full justify-center gap-5 flex flex-col" role="status">
        <Spinner />
        <p className="text-white text-center">Loading your chat...</p>
      </div>
    </div>)
  }

  return (
    <div className="w-full h-full">
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
        {
          messages.map((message) => (
            <MessageComponent key={message?.id} message={message} />
          ))
        }
        <div ref={scrollRef} />
      </div>

    </div>
  );
};

export default MessageList;
