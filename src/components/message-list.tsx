import React, { useContext, useEffect, useRef } from "react";
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
      entry?.target.scrollIntoView({ behavior: "smooth", block: "end" });
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
      <p className="text-white">Something went wrong. Refresh to try again.</p>
    );

  return (
    <div className="w-full">
        {
            messages.length > 0 ? (
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
            ) : (
                <div className="flex h-screen items-center justify-center" >
                    <div role="status">
                        <svg aria-hidden="true" className="w-16 h-16 text-gray-200 animate-spin dark:text-gray-600 fill-gray-600 dark:fill-gray-300" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                        </svg>
                        <span className="sr-only">Loading...</span>
                    </div>
                </div>
            )
        }
</div>
  );
};

export default MessageList;
