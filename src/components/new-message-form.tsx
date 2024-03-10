import React, { useState, useMemo } from "react";
import Image from "next/image";
import useSound from "use-sound";
import { useChatProvider } from "@/contexts/ChatContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import uploadImageIcon from "../../assets/upload-image-icon.svg";
import { Message } from "./message-component";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@clerk/nextjs";
import { useWorkOrder } from "@/contexts/WorkOrderContext";

export const NewMessageForm = () => {
  const [play] = useSound("sent.wav");
  const [body, setBody] = useState("");
  const { webSocket } = useWebSocket();
  const { addMessage } = useChatProvider();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const token: string | null = useAuthToken();
  const { getToken } = useAuth();
  const { current } = useWorkOrder();

  const inputsDisabled = useMemo(() => {
    return (
      !webSocket ||
      webSocket.readyState !== WebSocket.OPEN ||
      selectedFile ||
      current?.resolved === "COMPLETED"
    );
  }, [webSocket, selectedFile, current]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setBody(event.target.files[0].name); // show filename
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (body || selectedFile) {
      addNewMessage(body, selectedFile);
      setBody("");
      setSelectedFile(null);
    } else {
      console.log("No message or image to send");
    }
  };

  const sendMessageToWS = (message: Message) => {
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not ready");
      return;
    }

    webSocket.send(JSON.stringify(message));
    addMessage({
      // HACK: stopgap so that react doesn't complain about duplicate keys
      id: uuidv4(),
      username: "some_user",
      message: message.message,
      isImage: message.isImage,
      sentAt: Date.now() / 1000,
    });

    play();
  };

  const addNewMessage = async (body: string, file: File | null) => {
    let message = {
      id: uuidv4(),
      username: "some_user",
      conversationId: current?.conversation_id || "1", // HACK: fallback to 1 if we can't get convesation ID
      message: body,
      sentAt: Date.now() / 1000,
      authToken: await getToken(),
      isImage: false,
      index: current ? current?.machine_id : "validation-index",
    } as Message;

    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const dataURL = reader.result as string;

        message = {
          ...message,
          message: dataURL,
          isImage: true,
        };
        sendMessageToWS(message);
      };
    } else {
      sendMessageToWS(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-3">
      <style jsx>{`
        .image-upload > input {
          display: none;
        }
        .image-upload label {
          cursor: pointer;
        }
      `}</style>
      <div className="image-upload">
        <label htmlFor="file-input">
          <Image src={uploadImageIcon} alt="upload image" className="w-6 h-6" />
        </label>
        <input
          id="file-input"
          data-testid="file-input"
          name="image"
          type="file"
          accept=".png, .jpg, .jpeg"
          onChange={handleFileChange}
          disabled={inputsDisabled}
        />
      </div>

      <input
        autoFocus
        data-testid="message-input"
        id="message"
        name="message"
        placeholder={inputsDisabled ? "Inputs are disabled" : "Write a message..."}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="flex-1 h-12 px-3 rounded bg-[#222226] border border-[#222226] focus:border-[#222226] focus:outline-none text-white placeholder-white"
        disabled={inputsDisabled}
      />
      <button
        type="submit"
        className="bg-[#222226] rounded h-12 font-medium text-white w-24 text-lg border border-transparent hover:bg-[#363739] transition cursor-pointer"
        disabled={!body && !selectedFile && !inputsDisabled}
      >
        Send
      </button>
    </form>
  );
};
