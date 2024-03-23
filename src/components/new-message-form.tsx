import React, { useMemo, useState } from "react";
import Image from "next/image";
import useSound from "use-sound";
import { useChatProvider } from "@/contexts/ChatContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import uploadImageIcon from "../../assets/upload-image-icon.svg";
import { useAuth } from "@clerk/nextjs";
import { useWorkOrder } from "@/contexts/WorkOrderContext";
import { showToastWithRefresh } from "./toast-with-refresh";
import { ChatHandler } from "@/models/chat";

/* View */
export interface NewMessageFormViewProps {
  controllerBusy: boolean;
  onSend: (body: string, file: File | null) => Promise<void>;
};

export const NewMessageFormView = ({
  controllerBusy,
  onSend
}: NewMessageFormViewProps) => {
  const [body, setBody] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setBody(event.target.files[0].name); // show filename
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSend(body, selectedFile).then(() => {
      setBody("");
      setSelectedFile(null);
    });
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
          <Image src={uploadImageIcon} alt="upload image" className="w-8 h-8 md:w-6 md:h-6" />
        </label>
        <input
          id="file-input"
          data-testid="file-input"
          name="image"
          type="file"
          accept=".png, .jpg, .jpeg"
          onChange={handleFileChange}
          disabled={controllerBusy}
        />
      </div>

      <input
        autoFocus
        data-testid="message-input"
        id="message"
        name="message"
        placeholder={controllerBusy ? "Inputs are disabled" : "Write a message..."}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="flex-1 h-12 px-3 rounded bg-[#222226] border border-[#222226] focus:border-[#222226] focus:outline-none text-white placeholder-white"
        autoComplete="off"
        disabled={controllerBusy || selectedFile != null}
      />
      <button
        type="submit"
        className="bg-[#222226] rounded h-12 font-medium text-white w-24 text-lg border border-transparent hover:bg-[#363739] transition cursor-pointer"
        disabled={(body.trim() == "" && selectedFile == null) || controllerBusy}
      >
        Send
      </button>
    </form>
  );
};

/* Controller */
export const NewMessageFormController = ({ Child }: {
  Child:
  React.FC<NewMessageFormViewProps>
}) => {
  const [play] = useSound("sent.wav");
  const { webSocket } = useWebSocket();
  const chatProvider = useChatProvider();
  const { getToken } = useAuth();
  const workOrderProvider = useWorkOrder();

  const chatHandler = useMemo(() => {
    if (!webSocket) {
      return null;
    }

    return new ChatHandler(
      webSocket,
      chatProvider,
      workOrderProvider,
      async () => await getToken(),
      () => {
        play();
      },
      (error: string) => {
        console.error(error);
        showToastWithRefresh(error);
      }
    );
  }, [webSocket, chatProvider, workOrderProvider, getToken, play]);

  const onSend = async (body: string, file: File | null) => {
    if (!chatHandler) {
      console.error("ChatHandler is not initialized");
      showToastWithRefresh("ChatHandler is not initialized, please refresh.");
      return;
    }

    chatHandler.addNewMessage(body, file);
  }

  return <Child
    controllerBusy={chatHandler?.isBusy() ?? true}
    onSend={onSend}
  />;
};

const NewMessageForm =
  () => <NewMessageFormController Child={NewMessageFormView} />;
export default NewMessageForm;
