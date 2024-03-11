import React, { useState, useEffect } from "react";
import useSound from "use-sound";
import { useWebSocket } from "../contexts/WebSocketContext";
import { useAppSelector } from "../../redux/hook";
import { useAuth } from "@clerk/nextjs";

export const NewMessageForm = () => {
  const [play] = useSound("sent.wav");
  const [body, setBody] = useState("");
  const { addMessage, webSocket } = useWebSocket(); // Get WebSocket from context
  const { getToken } = useAuth();

  const uuid = useAppSelector((state) => state.uuid.value);

  useEffect(() => {
    const handleIncomingMessages = (event: MessageEvent) => {
      try {
        const messageData = JSON.parse(event.data);
        const textResponse = JSON.parse(messageData).body;

        const responseMessage = {
          id: "2",
          username: "bot",
          body: textResponse,
          createdAt: "1",
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

  const addNewMessage = async (body: string) => {
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      const message = {
        conversationId: "1",
        message: body,
        sentAt: 1,
        index: uuid,
        authToken: await getToken()
      };

      webSocket.send(JSON.stringify(message));
      addMessage({
        id: "1",
        username: "some_user",
        body: body,
        createdAt: "1",
      });

      play();
    } else {
      console.error("WebSocket is not connected.");
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (body) {
          addNewMessage(body);
          setBody("");
        }
      }}
      className="flex items-center space-x-3 w-full"
    >
      <input
        autoFocus
        id="message"
        name="message"
        placeholder="Write a message..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="flex-auto h-12 px-3 rounded bg-slate-400 border border-bg-slate-400 focus:border-slate-400 focus:outline-none text-black placeholder-black min-w-0"
      />
      <button
        type="submit"
        className="flex-initial bg-slate-400 rounded h-12 p-1 font-medium text-black w-24 text-sm border border-transparent hover:bg-slate-600 transition"
        disabled={!body}
      >
        Send
      </button>
    </form>
  );
};

export default NewMessageForm;
