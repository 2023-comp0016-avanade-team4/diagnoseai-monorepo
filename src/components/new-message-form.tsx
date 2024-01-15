import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import useSound from 'use-sound';
import { useWebSocket } from '@/contexts/WebSocketContext';
import uploadImageIcon from '../../assets/upload-image-icon.svg';

export const NewMessageForm = () => {
  const [play] = useSound('sent.wav');
  const [body, setBody] = useState('');
  const { addMessage, webSocket } = useWebSocket(); // Get WebSocket from context

  useEffect(() => {
    const handleIncomingMessages = (event: MessageEvent) => {
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

    if (webSocket) {
      webSocket.onmessage = handleIncomingMessages;

      return () => {
        webSocket.onmessage = null; // Cleanup event handler on unmount
      };
    }
  }, [addMessage, webSocket]);

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
      <style jsx>{` 
          .image-upload>input {
            display: none;
          }
          `}</style>
      <div className="image-upload">
        <label htmlFor="file-input">
          <Image src={uploadImageIcon} alt="upload image" className="w-6 h-6" />
        </label>
          <input 
            id="file-input"
            name="image"
            type="file"
            accept=".png, .jpg, .jpeg"
          />
      </div> 

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
