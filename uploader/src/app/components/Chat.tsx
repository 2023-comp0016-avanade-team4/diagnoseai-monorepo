import React from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import { Skeleton } from "@nextui-org/react";
import MessageList from "./MessageList";
import NewMessageForm from "./NewMessageForm";

// Almost pure UI component; the only logic is to check if the socket is ready
// No tests needed
const Chat = () => {
  const { isSocketReady } = useWebSocket();
  if (!isSocketReady) {
    return <Skeleton className="relative h-full bg-slate-400" />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-scroll no-scrollbar p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center">
            <MessageList />
          </div>
        </div>
      </div>
      <div className="p-3 bg-white/5 border-t border-slate-400">
        <div className="max-w-4xl mx-auto">
          <NewMessageForm />
        </div>
      </div>
    </div>
  );
};

export default Chat;
