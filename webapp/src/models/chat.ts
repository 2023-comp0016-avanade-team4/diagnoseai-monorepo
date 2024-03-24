/**
   This file contains models and domain specific logic for the chat feature.
*/

import { ChatContextType } from "@/contexts/ChatContext";
import { WorkOrderContextState } from "@/contexts/WorkOrderContext";
import { v4 as uuidv4 } from "uuid";
import { readAndCompressImage } from "browser-image-resizer";

// The backend also downscales the image, but we do it here to prevent
// reaching the maximum blob limit for base64-encoded images
const imageResizeConfig = {
  quality: 1.0,
  maxWidth: 800,
  maxHeight: 600,
  debug: false,
};

export type citationObject = {
  filepath: string;
};

export type Message = {
  id: string;
  username: string;
  message: string;
  sentAt: number;
  citations: citationObject[];
  isImage?: boolean;
  authToken?: string;
};

// THE message type received from the WebSocket.
// Will need to be converted to Message before it becomes useful
export type IntermediateResponseMessage = {
  body: string;
  conversationId: number;
  sentAt: number;
  citations: citationObject[];
  type: "message";
};

export class ChatHandler {
  ws: WebSocket;
  chatContext: ChatContextType;
  workOrderContext: WorkOrderContextState;
  tokenFn: () => Promise<string | null>;
  onSuccess: () => void;
  onError: (error: string) => void;

  constructor(
    ws: WebSocket,
    chatContext: ChatContextType,
    workOrderContext: WorkOrderContextState,
    tokenFn: () => Promise<string | null>,
    onSuccess: () => void,
    onError: (error: string) => void,
  ) {
    this.ws = ws;
    this.chatContext = chatContext;
    this.workOrderContext = workOrderContext;
    this.tokenFn = tokenFn;
    this.onSuccess = onSuccess;
    this.onError = onError;
  }

  private sendMessageToWS(message: Message) {
    const webSocket = this.ws;
    if (!webSocket || webSocket.readyState !== WebSocket.OPEN) {
      this.onError("WebSocket is not connected.");
      return;
    }

    webSocket.send(JSON.stringify(message));
    this.chatContext.addMessage({
      id: message.id,
      username: "this_user",
      message: message.message,
      isImage: message.isImage,
      sentAt: Date.now() / 1000,
      citations: [],
    });

    this.onSuccess();
  }

  private async addNewMessageWithImage(file: File, message: Message) {
    const compressed = await readAndCompressImage(file, imageResizeConfig);
    const reader = new FileReader();

    reader.onload = () => {
      const dataURL = reader.result as string;

      message = {
        ...message,
        message: dataURL,
        isImage: true,
      };
      this.sendMessageToWS(message);
    };

    reader.readAsDataURL(compressed);
    this.chatContext.setIsProcessingImage(true);

    setTimeout(() => {
      this.chatContext.addMessage({
        id: message.id,
        username: "bot",
        message: "Processing image...",
        isImage: false,
        sentAt: Date.now() / 1000,
        citations: [],
      });
    }, 250);
  }

  registerIncomingMessageHandler() {
    const boundHandler = this.incomingMessageHandler.bind(this);
    if (this.ws) {
      this.ws.addEventListener("message", boundHandler);

      return () => {
        this.ws.removeEventListener("message", boundHandler);
      };
    }
    return () => {};
  }

  async incomingMessageHandler(event: MessageEvent) {
    try {
      const messageData = JSON.parse(
        JSON.parse(event.data) as string,
      ) as IntermediateResponseMessage;
      if (
        this.workOrderContext.current?.conversation_id !==
        messageData.conversationId.toString()
      ) {
        return;
      }

      const responseMessage = {
        id: uuidv4(),
        username: "bot",
        message: messageData.body,
        sentAt: messageData.sentAt / 1000,
        citations: messageData.citations,
      } as Message;

      this.chatContext.addMessage(responseMessage);
    } catch (e) {
      this.onError("Error parsing incoming message.");
    }
  }

  async addNewMessage(body: string, file: File | null) {
    const current = this.workOrderContext.current;
    const message_uuid = uuidv4();
    let message = {
      id: message_uuid,
      username: "the_user",
      conversationId: current?.conversation_id || "-1", // -1 == transient
      message: body,
      sentAt: Date.now() / 1000,
      authToken: await this.tokenFn(),
      isImage: false,
      index: current ? current?.machine_id : "validation-index",
      citations: [],
    } as Message;

    if (file) {
      await this.addNewMessageWithImage(file, message);
    } else {
      this.sendMessageToWS(message);
    }
  }

  isBusy() {
    return (
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN ||
      this.workOrderContext.current === null ||
      this.workOrderContext.current?.resolved === "COMPLETED" ||
      this.chatContext.isProviderBusy
    );
  }
}
