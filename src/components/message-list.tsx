import React, { useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";

import { useWebSocket } from "@/contexts/WebSocketContext";
import { useChatProvider } from "@/contexts/ChatContext";
import { useWorkOrder } from "@/contexts/WorkOrderContext";
import {
  MessageComponent,
  Message,
  citationObject,
} from "@/components/message-component";
import { showToastWithRefresh } from "./toast-with-refresh";
import { Spinner } from "@nextui-org/react";
import { useAuth, useUser } from "@clerk/nextjs";
import { ChatHandler } from "@/models/chat";

export type IntermediateResponseMessage = {
  body: string;
  conversationId: number;
  sentAt: number;
  citations: citationObject[];
  type: "message";
};

export interface MessageListProps {
  messages: Message[];
  isProviderBusy: boolean;
  userPicture?: string;
};

export const MessageListView = ({ messages, isProviderBusy, userPicture }: MessageListProps) => {
  const [scrollRef, inView, entry] = useInView({
    trackVisibility: true,
    delay: 1000,
  });

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
            <MessageComponent key={message?.id} message={message} userPicture={userPicture} />
          ))
        }
        <div className="h-[10px]" ref={scrollRef} />
      </div>

    </div>
  );
}

export const MessageListController = ({ Child }: { Child: React.FC<MessageListProps> }) => {
  const { webSocket } = useWebSocket();
  const { getToken } = useAuth();
  const { user } = useUser();
  const chatProvider = useChatProvider();
  const workOrderProvider = useWorkOrder();
  const { current } = workOrderProvider;
  const { fetchHistory } = chatProvider;

  const chatHandler = useMemo(() => {
    if (!webSocket) return null;

    return new ChatHandler(
      webSocket,
      chatProvider,
      workOrderProvider,
      async () => await getToken(),
      () => {},
      (e) => {
        showToastWithRefresh(e);
        console.error(e);
      }
    );
  }, [webSocket, chatProvider, workOrderProvider, getToken]);

  useEffect(() => {
    return chatHandler?.registerIncomingMessageHandler();
  }, [chatHandler, webSocket]);

  useEffect(() => {
    if (current)
      fetchHistory(current.conversation_id);
  }, [current, fetchHistory])

  return (<Child
    messages={chatProvider.messages}
    isProviderBusy={chatProvider.isProviderBusy}
    userPicture={user?.imageUrl}
  />);
}

export const MessageList = () =>
  <MessageListController Child={MessageListView} />;

export default MessageList;
