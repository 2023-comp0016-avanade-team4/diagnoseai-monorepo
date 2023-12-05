import React, { useState, useEffect, useContext } from 'react';
import useSound from 'use-sound';
import { useWebSocket, WebSocketContext } from '@/contexts/WebSocketContext';


export type AddNewMessageRequest = {
  username: string,
  avatar?: string | null,
  body: string
};

export const NewMessageForm = () => {
  const [play] = useSound('sent.wav');
  const [body, setBody] = useState('');
  const { wsUrl } = useWebSocket();
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

  useEffect(() => {    
    if (wsUrl) {
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const messageData = JSON.parse(event.data);
          const textResponse = JSON.parse(messageData).body;

          const responseMessage = {
            id: "2",
            username: "bot",
            avatar: 'https://avatars.githubusercontent.com/u/1856293?v=4',
            body: textResponse,
            createdAt: "1"
          };
          addMessage(responseMessage);

        } catch (error) {
          console.error("Error parsing message data:", error);
        }
      };

      setWebSocket(ws);

      return () => {
        ws.close(); // Clean up the WebSocket connection on unmount
      };
    }
  }, [wsUrl]);
  const { addMessage } = useContext(WebSocketContext);


  const addNewMessage = (body: string) => {
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      const message = {
        conversationId: "1",
        message: body,
        sentAt: 1
      };

      webSocket.send(JSON.stringify(message));
      addMessage({
        id: "1",
        username: "some_user",
        avatar: 'https://avatars.githubusercontent.com/u/114498077?v=4',
        body: body,
        createdAt: "1"
      });

      play();
    } else {
      console.error('WebSocket is not connected.');
    }
  };
  

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (body) {
          addNewMessage(body);
          setBody('');
        }
      }}
      className="flex items-center space-x-3"
    >
      <input
        autoFocus
        id="message"
        name="message"
        placeholder="Write a message..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="flex-1 h-12 px-3 rounded bg-[#222226] border border-[#222226] focus:border-[#222226] focus:outline-none text-white placeholder-white"
      />
      <button
        type="submit"
        className="bg-[#222226] rounded h-12 font-medium text-white w-24 text-lg border border-transparent hover:bg-[#363739] transition"
        disabled={!body}
      >
        Send
      </button>
    </form >
  );
};
