import React, { useContext, useEffect } from "react";
import { useInView } from "react-intersection-observer";

import MessageComponent from "./MessageComponent";
import { useWebSocket } from "@/app/contexts/WebSocketContext";

// This component is fairly insignificnat; there is no need to
// refactor it to MVC.  The only thing the controller would be doing
// is to handle the scrolling.
const MessageList = () => {
  const [scrollRef, inView, entry] = useInView({
    trackVisibility: true,
    delay: 1000,
  });

  const { messages } = useWebSocket();

  useEffect(() => {
    if (entry?.target) {
      setTimeout(() => {
        entry.target.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 200);
    }
  }, [messages?.length, entry?.target]);

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
