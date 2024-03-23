import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { act } from "react-dom/test-utils";
import { NewMessageFormView, NewMessageFormController, NewMessageFormViewProps } from "./new-message-form";

describe("NewMessageForm view", () => {
  it("Only accepts only images", () => {
    const chat = render(<NewMessageFormView
      controllerBusy={false}
      onSend={async (_a, _b) => {}}
    />);
    const imageInput = chat.baseElement.getElementsByTagName("input").item(0);
    expect(imageInput).toHaveAttribute("accept", ".png, .jpg, .jpeg");
  });

  it("Calls onSend with body and file", () => {
    const onSend = jest.fn().mockResolvedValue(null);
    const { getByText } = render(<NewMessageFormView
      controllerBusy={false}
      onSend={onSend}
    />);
    const fileInput = screen.getByTestId("file-input") as HTMLInputElement;
    const sendButton = getByText("Send") as HTMLButtonElement;

    const file = new Blob(["dummy content"], { type: "image/jpeg" });
    Object.defineProperty(file, "name", {
      value: "test.jpg",
    });

    // file selection and form submission
    act(() => fireEvent.change(fileInput, { target: { files: [file] } }));
    waitFor(() => expect(sendButton).toBeEnabled());
    act(() => fireEvent.click(sendButton));

    expect(onSend).toHaveBeenCalledWith('test.jpg', fileInput.files?.[0]);
  });

  it("Is disabled when controller is busy", () => {
    const chat = render(<NewMessageFormView
      controllerBusy={true}
      onSend={async (_a, _b) => {}}
    />);
    const fileInput = screen.getByTestId("file-input") as HTMLInputElement;
    const messageInput = chat.baseElement.getElementsByTagName("input").item(1);
    expect(messageInput).toHaveAttribute("disabled");
    expect(fileInput).toHaveAttribute("disabled");
  });
})

describe("NewMessageForm controller", () => {
  it("Sends message only", () => {
    const DummyComponent = ({ controllerBusy, onSend }: NewMessageFormViewProps) => {
      useEffect(() => {
        if (!controllerBusy)
          onSend('test', null);
      });
      return <div></div>;
    };
    const chatHandler = {
      addNewMessage: jest.fn(),
    };

    jest.mock('../models/chat', () => {
      return {
        ChatHandler: jest.fn().mockImplementation(() => {
          return chatHandler
        }),
      };
    });
    render(<NewMessageFormController Child={DummyComponent} />);

    waitFor(() => expect(chatHandler.addNewMessage).toHaveBeenCalledWith(
      'test', null));
  });

  it("is busy if chat handler not available", () => {
    let done = false;
    const DummyComponent = ({ controllerBusy }: NewMessageFormViewProps) => {
      expect(controllerBusy).toBe(true);
      done = true;
      return <div></div>;
    };
    const chatHandler = {
      addNewMessage: jest.fn(),
      isBusy: () => true,
    };

    jest.mock('../models/chat', () => {
      return {
        ChatHandler: jest.fn().mockImplementation(() => {
          return chatHandler;
        }),
      };
    });

    render(<NewMessageFormController Child={DummyComponent} />);
    () => expect(done).toBe(true);
  });
});
