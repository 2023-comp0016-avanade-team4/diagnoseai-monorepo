import { render, fireEvent, waitFor } from "@testing-library/react";
import NewMessageForm from "../app/components/NewMessageForm";
import MessageList from "../app/components/MessageList";

let mockWebSocketSender = jest.fn();

jest.mock("next/navigation", () => {
  return {
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
    usePathname: jest.fn(),
  };
});

jest.mock("react-intersection-observer", () => ({
  useInView: () => [jest.fn(), false, { target: jest.fn() }],
}));

jest.mock("../app/contexts/WebSocketContext", () => ({
  useWebSocket: () => ({
    webSocket: {
      readyState: WebSocket.OPEN,
      send: mockWebSocketSender,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    addMessage: jest.fn(),
    messages: [],
  }),
}));

jest.mock("@clerk/nextjs", () => ({
  useAuth: jest.fn().mockReturnValue({
    getToken: jest.fn().mockResolvedValue("mock-token"),
  }),
  useUser: jest.fn().mockReturnValue({
    user: {
      imageUrl: "something",
    },
  }),
}));

describe("Message Interaction", () => {
  beforeAll(() => {
    global.URL.createObjectURL = jest.fn();
  });

  beforeEach(() => {
    mockWebSocketSender.mockClear();
  });

  it("shows the message as it is being sent", () => {
    const { getByText } = render(<MessageList />);
    const { getByTestId } = render(<NewMessageForm />);
    const sendButton = getByText("Send") as HTMLButtonElement;
    let textbox = getByTestId("message-input") as HTMLInputElement;
    textbox.value = "hello";

    fireEvent.click(sendButton);
    waitFor(() => getByText("hello"));
  });
});
