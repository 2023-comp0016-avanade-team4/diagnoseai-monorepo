import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { ButtonWithModalConfirmation } from "./button-with-modal-confirmation";

describe("ButtonWithModalConfirmation", () => {
  it("renders button with modal confirmation", async () => {
    const mockOnClick = jest.fn();
    render(
      <div id="app">
        <ButtonWithModalConfirmation
          svgPath=""
          modalPrompt="Are you sure?"
          alt="test"
          onClick={mockOnClick}
        />
      </div>,
    );
    const button = screen.getByTitle("test");
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    await waitFor(() =>
      expect(screen.getByText("Are you sure?")).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByText("Confirm")).toBeInTheDocument(),
    );
    const confirmButton = screen.getByText("Confirm") as HTMLButtonElement;
    expect(confirmButton).toBeInTheDocument();

    fireEvent.click(confirmButton);
    await waitFor(() => expect(mockOnClick).toHaveBeenCalled());
  });

  it("cancel does not call mockOnClick ", async () => {
    const mockOnClick = jest.fn();
    render(
      <div id="app">
        <ButtonWithModalConfirmation
          svgPath=""
          modalPrompt="Are you sure?"
          alt="test"
          onClick={mockOnClick}
        />
      </div>,
    );
    const button = screen.getByTitle("test");
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    await waitFor(() =>
      expect(screen.getByText("Are you sure?")).toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByText("Confirm")).toBeInTheDocument(),
    );
    const cancelButton = screen.getByText("Cancel") as HTMLButtonElement;
    expect(cancelButton).toBeInTheDocument();

    fireEvent.click(cancelButton);
    await waitFor(() => expect(mockOnClick).not.toHaveBeenCalled());
  });
});
