import React, { useState, useEffect } from "react";
import Image from "next/image";
import useSound from "use-sound";
import { useWebSocket } from "@/contexts/WebSocketContext";
import uploadImageIcon from "../../assets/upload-image-icon.svg";
import useAuthToken from "@/hooks/use-auth-token";
import { Message } from "./message-component";
import { v4 as uuidv4 } from "uuid";

export const NewMessageForm = () => {
  const [play] = useSound("sent.wav");
  const [body, setBody] = useState("");
  const { addMessage, webSocket } = useWebSocket(); // Get WebSocket from context
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const token = useAuthToken();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    // temp URL to display in chat (not working rn)
    const imageURL = URL.createObjectURL(file);
    addImageMessage(imageURL);

    try {
      const response = await fetch(
        "https://diagnoseai-core-apis.azure-api.net/core/chat_img?conversation_id=123",
        {
          method: "POST",
          body: formData,
          headers: {
            "Ocp-Apim-Subscription-Key": "14accc73703e44e2b4ed893edd5fb01b",
            "Auth-Token": token || "",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Image upload failed");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
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

  const addImageMessage = (imageURL: string) => {
    const imageMessage = {
      id: uuidv4(),
      username: "some_user",
      avatar: "https://avatars.githubusercontent.com/u/114498077?v=4",
      message: `<img src="${imageURL}" alt="uploaded image"/>`,
      createdAt: new Date().toISOString(),
    } as Message;

    addMessage(imageMessage);
    // URL.revokeObjectURL(imageURL)
  };

  useEffect(() => {
    const handleIncomingMessages = (event: MessageEvent) => {
      try {
        const messageData = JSON.parse(event.data);
        const textResponse = JSON.parse(messageData).body;

        const responseMessage = {
          id: "2",
          username: "bot",
          avatar: "https://avatars.githubusercontent.com/u/1856293?v=4",
          message: textResponse,
          createdAt: "1",
        } as Message;
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
      avatar: "https://avatars.githubusercontent.com/u/114498077?v=4",
      message: body,
      createdAt: Date.now().toString(),
    });

    play();
  }


  const addNewMessage = (body: string, file: File | null) => {
    let message = {
      conversationId: "1",
      message: body,
      sentAt: 1,
      authToken: token,
    } as Message;

    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const dataURL = reader.result as string;
        console.log(dataURL);

        message = {
          ...message,
          message: dataURL,
          isImage: true,
        };
        sendMessageToWS(message);
      }
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
        disabled={!body && !selectedFile}
      >
        Send
      </button>
    </form>
  );
};
