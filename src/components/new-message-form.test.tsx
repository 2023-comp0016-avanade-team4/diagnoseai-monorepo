import React from "react";
import { render, fireEvent, waitFor, screen, cleanup } from "@testing-library/react";
import fetch, { enableFetchMocks } from "jest-fetch-mock";
import { useAuth } from "@clerk/nextjs";
import { useWorkOrder } from "@/contexts/WorkOrderContext";
import { NewMessageForm } from "./new-message-form"; // adjust the import path accordingly

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue("mock-token"),
  }),
}));

let mockWebSocketSender = jest.fn();

jest.mock("@/contexts/WebSocketContext", () => ({
  useWebSocket: () => ({
    webSocket: {
      readyState: WebSocket.OPEN,
      send: mockWebSocketSender,
    },
  }),
}));

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: async () =>
      new Promise((resolve) => {
        resolve("mocked-token");
      }
      ),
  }),
}));

jest.mock("../contexts/WorkOrderContext", () => ({
  useWorkOrder: jest.fn(),
}));

(useWorkOrder as jest.Mock).mockReturnValue({
  current: {
    order_id: "mocked-order-id-1",
    machine_id: "mocked-machine-id",
    machine_name: "mocked-machine-name",
    conversation_id: "mocked-conversation-id",
    resolved: "COMPLETED",
  },
});

jest.mock("../contexts/WebSocketContext", () => ({
  useWebSocket: () => ({
    webSocket: {
      readyState: WebSocket.OPEN,
    },
    sendMessageToWS: jest.fn(),
  }),
}));

describe("NewMessageForm", () => {
  it("Only accepts only images", () => {
    const chat = render(<NewMessageForm />);
    const imageInput = chat.baseElement.getElementsByTagName("input").item(0);
    expect(imageInput).toHaveAttribute("accept", ".png, .jpg, .jpeg");
  });
});

describe("NewMessageForm", () => {
  beforeAll(() => {
    global.URL.createObjectURL = jest.fn();
  });

  beforeEach(() => {
    mockWebSocketSender.mockClear();
  });

  it("Only accepts only images", () => {
    const chat = render(<NewMessageForm />);
    const imageInput = chat.baseElement.getElementsByTagName("input").item(0);
    expect(imageInput).toHaveAttribute("accept", ".png, .jpg, .jpeg");
  });

  it("uploads an image and checks the Auth-Token header", async () => {
    const { getByText } = render(<NewMessageForm />);
    const fileInput = screen.getByTestId("file-input");
    const sendButton = getByText("Send");

    const file = new Blob(["dummy content"], { type: "image/jpeg" });
    Object.defineProperty(file, "name", {
      value: "test.jpg",
    });

    // file selection and form submission
    fireEvent.change(fileInput, { target: { files: [file] } });
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
