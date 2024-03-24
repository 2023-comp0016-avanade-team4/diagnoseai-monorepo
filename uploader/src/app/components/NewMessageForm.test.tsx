import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import {
  NewMessageFormController,
  NewMessageFormViewProps,
} from "./NewMessageForm";

jest.mock("next/navigation", () => {
  return {
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
    usePathname: jest.fn(),
  };
});

let mockSend = jest.fn();
jest.mock("../contexts/WebSocketContext", () => ({
  useWebSocket: () => ({
    addMessage: jest.fn(),
    webSocket: {
      readyState: 1,
      send: mockSend,
      onmessage: null,
    },
  }),
}));

jest.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    authToken: () => "test-token",
    getToken: async () => "test-token",
  }),
}));

describe("NewMessageFormController component", () => {
  const TestView = ({
    body,
    setBody,
    addNewMessage,
    index,
  }: NewMessageFormViewProps) => (
    <div>
      <input
        data-testid="body-input"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button
        data-testid="send-button"
        onClick={() => addNewMessage(body, index)}
      >
        Send
      </button>
    </div>
  );

  it('adds a new message when "Send" is clicked', async () => {
    const { getByTestId } = render(
      <NewMessageFormController View={TestView} />,
    );

    const bodyInput = getByTestId("body-input");
    const sendButton = getByTestId("send-button");

    fireEvent.change(bodyInput, { target: { value: "Test message" } });
    fireEvent.click(sendButton);

    const expectedMessage = {
      conversationId: "-1",
      message: "Test message",
      sentAt: Math.floor(Date.now() / 1000),
      index: "123",
      authToken: "test-token",
    };

    waitFor(() =>
      expect(mockSend).toHaveBeenCalledWith(JSON.stringify(expectedMessage)),
    );
  });
});
