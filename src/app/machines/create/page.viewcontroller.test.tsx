import { render, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { ViewController } from "./page.viewcontroller";
import { createMachine } from "@/apis";

jest.mock("../../../apis", () => ({
  createMachine: jest.fn(() =>
    Promise.resolve({ data: { message: "success" } }),
  ),
}));

describe("MachineCreateViewController", () => {
  const View = ({
    manufacturer,
    model,
    handleSubmit,
    setManufacturer,
    setModel,
  }) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit?.(e);
      }}
    >
      <input
        data-testid="man"
        onChange={(e) => setManufacturer(e.target.value)}
        value={manufacturer}
      />
      <input
        data-testid="mod"
        onChange={(e) => setModel(e.target.value)}
        value={model}
      />
      <button type="submit">Submit</button>
    </form>
  );

  beforeEach(() => {
    (createMachine as jest.Mock).mockClear();
  });

  it("should set response to success message upon successful submit", async () => {
    const { getByTestId, getByRole } = render(<ViewController View={View} />);
    const button = getByRole("button");

    fireEvent.change(getByTestId("man"), { target: { value: "Manufacturer" } });
    fireEvent.change(getByTestId("mod"), { target: { value: "Model" } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(createMachine).toHaveBeenCalledWith("Manufacturer", "Model");
    });
  });

  it("should reject if any fields are empty", async () => {
    const { getByRole } = render(<ViewController View={View} />);
    const button = getByRole("button");

    fireEvent.click(button);

    await waitFor(() => {
      expect(createMachine).not.toHaveBeenCalled();
    });
  });
});
