import { Uploader as FileUploader } from "./FileUploader";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from "@testing-library/react";
import { Provider } from "react-redux";
import configureMockStore from "redux-mock-store";

jest.mock("./FileUploader", () => ({
  ...jest.requireActual("./FileUploader"),
  performUpload: jest.fn(),
}));

global.alert = jest.fn().mockImplementation(() => {});

// Mock store setup
const middlewares = [];
const mockStore = configureMockStore(middlewares);
const initialState = {}; // Adjust according to your actual Redux store's initial state
const store = mockStore(initialState);

const setUploaderWithFile = () => {
  const uploader = render(
    <Provider store={store}>
      <FileUploader />
    </Provider>
  );
  const fileInput = uploader.baseElement.getElementsByTagName("input").item(0);
  const file = new File(["reeeee"], "test.pdf", { type: "document/pdf" });
  fireEvent.change(fileInput!, { target: { files: [file] } });
};

describe("File Uploader", () => {
  it("Shows a prompt to upload after a while", () => {
    render(
      <Provider store={store}>
        <FileUploader />
      </Provider>
    );
    expect(screen.getByText("Upload")).toBeInTheDocument();
  });

  it("Only accepts PDFs and DOCXs", () => {
    const uploader = render(
      <Provider store={store}>
        <FileUploader />
      </Provider>
    );
    const fileInput = uploader.baseElement
      .getElementsByTagName("input")
      .item(0);
    expect(fileInput).toHaveAttribute("accept", ".pdf,.docx");
  });

  it("Button is disabled when there are no files selected", () => {
    render(
      <Provider store={store}>
        <FileUploader />
      </Provider>
    );
    expect(screen.getByText("Confirm Upload")).toBeDisabled();
  });

  it("Button is enabled when there is a file selected", () => {
    setUploaderWithFile();
    expect(screen.getByText("Confirm Upload")).toBeEnabled();
  });

  it("Tries to submit data to the server upon clicking upload", async () => {
    setUploaderWithFile();

    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ error: false }),
      })
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Confirm Upload"));
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/fileUpload", {
      body: expect.any(FormData),
      method: "POST",
    });
  });

  it("Shows an error if the server returns an error", async () => {
    setUploaderWithFile();

    global.fetch = jest.fn().mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve({ error: true }),
      })
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Confirm Upload"));
    });

    await waitFor(() =>
      expect(global.alert).toHaveBeenCalledWith("cannot upload file")
    );
  });
});
