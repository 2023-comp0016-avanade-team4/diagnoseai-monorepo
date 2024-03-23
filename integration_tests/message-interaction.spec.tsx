import React from "react";
import { render, fireEvent, waitFor, screen, cleanup, act } from "@testing-library/react";
import { useWorkOrder } from "@/contexts/WorkOrderContext";
import NewMessageForm from "@/components/new-message-form";


let mockWebSocketSender = jest.fn();

jest.mock("@/contexts/WebSocketContext", () => ({
  useWebSocket: () => ({
    webSocket: {
      readyState: WebSocket.OPEN,
      send: mockWebSocketSender,
    },
  }),
}));

jest.mock("@/contexts/WorkOrderContext", () => ({
  useWorkOrder: jest.fn(),
}));

jest.mock("@/contexts/ChatContext", () => ({
  useChatProvider: () => ({
    addMessage: jest.fn(),
    isProcessingImage: false,
    setIsProcessingImage: jest.fn(),
    isProviderBusy: false,
  }),
}));

(useWorkOrder as jest.Mock).mockReturnValue({
  current: {
    order_id: "mocked-order-id-1",
    machine_id: "mocked-machine-id",
    machine_name: "mocked-machine-name",
    conversation_id: "mocked-conversation-id",
    resolved: "NOT_COMPLETED",
  },
});

describe("Message Interaction", () => {
  beforeAll(() => {
    global.URL.createObjectURL = jest.fn();
  });

  beforeEach(() => {
    mockWebSocketSender.mockClear();
  });

  it("uploads an image", async () => {
    const { getByText } = render(<NewMessageForm />);
    const fileInput = screen.getByTestId("file-input");
    const sendButton = getByText("Send") as HTMLButtonElement;

    const file = new Blob(["dummy content"], { type: "image/jpeg" });
    Object.defineProperty(file, "name", {
      value: "test.jpg",
    });

    // file selection and form submission
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => expect(sendButton).toBeEnabled());
    fireEvent.click(sendButton);

    await waitFor(() => expect(mockWebSocketSender).toHaveBeenCalled());
    const jsonVal = JSON.parse(mockWebSocketSender.mock.calls[0][0]);
    expect(jsonVal.isImage).toBe(true);
    expect(jsonVal.message).toContain("data:image/jpeg;base64,");
    expect(jsonVal.authToken).toBe("mock-token");
  });

  it("disables the textbox when the current work order is not resolved", () => {
    const notResolvedWorkOrder = {
      order_id: "mocked-order-id-1",
      machine_id: "mocked-machine-id",
      machine_name: "mocked-machine-name",
      conversation_id: "mocked-conversation-id",
      resolved: "NOT_COMPLETED",
    };

    (useWorkOrder as jest.Mock).mockReturnValue({
      current: notResolvedWorkOrder,
    });

    let { getByTestId } = render(<NewMessageForm />);
    let textbox = getByTestId("message-input");
    expect(textbox).toBeEnabled();
    cleanup();

    (useWorkOrder as jest.Mock).mockReturnValue({
      current: {
        ...notResolvedWorkOrder,
        resolved: "COMPLETED",
      },
    });

    getByTestId = render(<NewMessageForm />).getByTestId;
    textbox = getByTestId("message-input");
    expect(textbox).toBeDisabled();
  });
});
