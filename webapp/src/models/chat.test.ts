import { ChatContextType } from "@/contexts/ChatContext";
import { WorkOrderContextState } from "@/contexts/WorkOrderContext";
import { waitFor } from "@testing-library/react";
import { ChatHandler } from "./chat";
import { readAndCompressImage } from "browser-image-resizer";

const chatHandlerMock = () => {
  const chatContext = {
    addMessage: jest.fn(),
    setIsProcessingImage: jest.fn(),
  };
  const webSocket = {
    readyState: WebSocket.OPEN,
    send: jest.fn(),
  };
  const workOrderContext = {};
  const tokenFn = jest.fn();
  const onSuccess = jest.fn();
  const onError = jest.fn();
  const chatHandler = new ChatHandler(
    webSocket as any as WebSocket,
    chatContext as any as ChatContextType,
    workOrderContext as any as WorkOrderContextState,
    tokenFn,
    onSuccess,
    onError,
  );

  return {
    webSocket,
    chatHandler,
    chatContext,
    workOrderContext,
    tokenFn,
    onSuccess,
    onError,
  };
};

describe("Chat Gateway", () => {
  it("calls onSuccess() when a message is sent", () => {
    const { chatHandler, onSuccess, webSocket } = chatHandlerMock();

    chatHandler.addNewMessage("xdx", null);
    waitFor(() => expect(webSocket.send).toHaveBeenCalled());
    waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it("calls onError() when a message is sent and WebSocket is not connected", () => {
    const { chatHandler, onError, webSocket } = chatHandlerMock();
    webSocket.readyState = WebSocket.CLOSED;
    waitFor(() => expect(chatHandler.isBusy()).toBe(true));

    chatHandler.addNewMessage("xdx", null);
    waitFor(() => expect(webSocket.send).not.toHaveBeenCalled());
    waitFor(() => expect(onError).toHaveBeenCalled());
  });

  it("uses file reader to read image", async () => {
    const { chatHandler, webSocket } = chatHandlerMock();
    const file = new File([""], "test.jpg", { type: "image/jpeg" });

    chatHandler.addNewMessage("", file);
    waitFor(() => expect(webSocket.send).toHaveBeenCalled());
    waitFor(() => expect(readAndCompressImage).toHaveBeenCalled());
  });
});
