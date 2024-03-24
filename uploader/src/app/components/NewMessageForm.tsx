import React, { useState, useEffect } from "react";
import useSound from "use-sound";
import { useWebSocket } from "@/app/contexts/WebSocketContext";
import { useAuth } from "@clerk/nextjs";
import { v4 as uuid4 } from "uuid";
import { useSearchParams } from "next/navigation";

export type NewMessageFormViewProps = {
  body: string;
  setBody: Function;
  addNewMessage: Function;
  index?: string;
};
export const NewMessageFormView: React.FC<NewMessageFormViewProps> = ({
  body,
  setBody,
  addNewMessage,
  index,
}) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (body && index) {
          addNewMessage(body, index);
          setBody("");
        }
      }}
      className="flex items-center space-x-3 w-full"
    >
      <input
        autoComplete="off"
        autoFocus
        data-testid="message-input"
        id="message"
        name="message"
        placeholder="Write a message..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="flex-auto h-12 px-3 rounded bg-slate-300 border border-bg-slate-400 focus:border-slate-400 focus:outline-none text-black placeholder-black min-w-0"
      />
      <button
        type="submit"
        className="flex-initial bg-slate-300 rounded h-12 p-1 font-medium text-black w-24 text-sm border border-transparent hover:bg-slate-600 transition"
        disabled={!body}
      >
        Send
      </button>
    </form>
  );
};

export const NewMessageFormController = ({
  View,
}: {
  View: React.FC<NewMessageFormViewProps>;
}) => {
  const [play] = useSound("/sent.wav");
  const [body, setBody] = useState("");
  const { addMessage, webSocket } = useWebSocket(); // Get WebSocket from context
  const { getToken } = useAuth();

  useEffect(() => {
    const handleIncomingMessages = (event: MessageEvent) => {
      try {
        const messageData = JSON.parse(event.data);
        const textResponse = JSON.parse(messageData).body;

        const responseMessage = {
          id: uuid4(),
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

  const addNewMessage = async (body: string, index: string) => {
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      const message = {
        // NOTE: Ethereal conversations are implemented as -1
        conversationId: "-1",
        message: body,
        sentAt: Math.floor(Date.now() / 1000),
        index,
        authToken: await getToken(),
      };

      webSocket.send(JSON.stringify(message));
      addMessage({
        id: uuid4(),
        username: "irrelevant",
        body: body,
        createdAt: String(Math.floor(Date.now() / 1000)),
      });

      play();
    } else {
      console.error("WebSocket is not connected.");
    }
  };

  const params = useSearchParams();
  const index = params?.get("index");

  return (
    <View
      body={body}
      setBody={setBody}
      addNewMessage={addNewMessage}
      index={index!}
    />
  );
};

const NewMessageForm = () => {
  return <NewMessageFormController View={NewMessageFormView} />;
};

export default NewMessageForm;
