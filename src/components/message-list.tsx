import React, { useContext } from 'react';
import { WebSocketContext } from '@/contexts/WebSocketContext';
import { Message as MessageComponent } from '@/components/message-component';

export const MessageList = () => {
  const { messages } = useContext(WebSocketContext);

  return (
    <div className="messages-list">
      {messages.map((message) => (
        <MessageComponent key={message.id} message={message} />
      ))}
    </div>
  );
};

export default MessageList;
