import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
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

  it("cannot read the file and logs an error", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    const readAsDataURLSpy = jest.fn();

    jest.spyOn(global, "FileReader").mockImplementation(() => {
      return {
        readAsDataURL: readAsDataURLSpy,
        onload: null,
        onerror: null,
      } as unknown as FileReader;
    });

    readAsDataURLSpy.mockImplementation(function (this: FileReader) {
      this.onerror?.(new ProgressEvent('error') as unknown as ProgressEvent<FileReader>);
    });

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

    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());
    expect(readAsDataURLSpy).toHaveBeenCalled();
  });
});
