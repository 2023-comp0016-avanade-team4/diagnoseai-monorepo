import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import fetch, { enableFetchMocks } from "jest-fetch-mock";
import { NewMessageForm } from "./new-message-form"; // adjust the import path accordingly

enableFetchMocks();

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
    fetch.resetMocks();
  });

  it("uploads an image and checks the Auth-Token header", async () => {
    fetch.mockResponseOnce(JSON.stringify({ data: "12345" }));

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

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    expect(fetch.mock.calls[0][0]).toEqual(
      "https://diagnoseai-core-apis.azure-api.net/core/chat_img?conversation_id=123"
    );
    const headers = fetch.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["Auth-Token"]).toBeDefined();
  });
});
