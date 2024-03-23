import { render, screen, waitFor } from "@testing-library/react";
import { MessageListView, MessageListController } from "./message-list";
import { Message } from "@/models/chat";

jest.mock("@/contexts/WorkOrderContext", () => ({
  useWorkOrder: jest.fn(() => ({})),
}));

jest.mock("@/contexts/WebSocketContext", () => ({
  useWebSocket: jest.fn(() => ({
    webSocket: {
      readyState: WebSocket.OPEN,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
  }))
}));

jest.mock("@clerk/nextjs", () => ({
  useAuth: jest.fn().mockReturnValue({
    getToken: jest.fn()
  }),
  useUser: jest.fn().mockReturnValue({
    user: {
      imageUrl: 'something'
    }
  }),
}));

jest.mock("@/contexts/ChatContext", () => ({
  useChatProvider: jest.fn(() => ({ messages: [], isProviderBusy: false })),
}));

jest.mock('react-intersection-observer', () => ({
  useInView: () => [jest.fn(), false, { target: jest.fn() }],
}));

describe("MessageListView", () => {
  const mockMessages = [
    { id: "1", username: "test user", message: "test message 1", sentAt: 123456, citations: [], isImage: false },
    { id: "2", username: "test user", message: "test message 2", sentAt: 123456, citations: [], isImage: false },
  ] as Message[];

  it("renders messages correctly", () => {
    render(<MessageListView messages={mockMessages} isProviderBusy={false} />);

    expect(screen.getByText("test message 1")).toBeInTheDocument();
    expect(screen.getByText("test message 2")).toBeInTheDocument();
  });

  it("shows 'No messages!' when there are no messages and provider is not busy", () => {
    render(<MessageListView messages={[]} isProviderBusy={false} />);

    expect(screen.getByText("No messages! Chat with DiagnoseAI to get started")).toBeInTheDocument();
  });

  it("shows loading state when provider is busy", () => {
    render(<MessageListView messages={[]} isProviderBusy={true} />);

    expect(screen.getByText("Loading your chat...")).toBeInTheDocument();
  });
});

describe("MessageListController", () => {
  it("should register the handler", () => {
    const ChildMock = jest.fn(() => <div>Test</div>);
    const registerIncomingMessageHandlerMock = jest.fn();

    // check if chatHandler's registerIncomingMessageHandler was called
    jest.mock('../models/chat', () => ({
      ChatHandler: jest.fn().mockImplementation(() => ({
        registerIncomingMessageHandler: registerIncomingMessageHandlerMock,
      })),
    }));

    render(<MessageListController Child={ChildMock} />);
    waitFor(() => expect(registerIncomingMessageHandlerMock).toHaveBeenCalled());
  });
});
