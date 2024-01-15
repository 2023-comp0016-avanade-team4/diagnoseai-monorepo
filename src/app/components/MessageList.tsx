import React, { useContext, useEffect } from 'react';
import { useInView } from "react-intersection-observer";

import MessageComponent from './MessageComponent';
import { WebSocketContext } from '../contexts/WebSocketContext';


const MessageList = () => {
  const [scrollRef, inView, entry] = useInView({
    trackVisibility: true,
    delay: 1000,
  });
  // const messages = [{
  //   id: '123',
  //   username: 'some_user',
  //   body: 'some message',
  //   createdAt: '2024-01-06T18:40:30.781Z'
  // },
  // {
  //   id: '456',
  //   username: 'bot',
  //   body: 'some other message',
  //   createdAt: '2024-01-06T18:40:30.781Z'
  // }];
  const { messages } = useContext(WebSocketContext)!;


  useEffect(() => {
    if (entry?.target) {
      entry.target.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages?.length, entry?.target]);

  return (
    <div className="flex flex-col w-full space-y-3 overflow-y-scroll no-scrollbar">
      {!inView && messages?.length && (
        <div className="py-1.5 w-full px-3 z-10 text-xs absolute flex justify-center bottom-0 mb-[120px] inset-x-0">
          <button
            className="py-1.5 px-3 text-xs bg-[#1c1c1f] border border-[#363739] rounded-full text-white font-medium"
            onClick={() => {
              entry?.target.scrollIntoView({ behavior: "smooth", block: "end" })
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
