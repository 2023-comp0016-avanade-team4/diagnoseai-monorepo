import { render, fireEvent, waitFor } from "@testing-library/react";
import { ViewController } from "./page.viewcontroller";
import { deleteWorkOrder } from "@/apis";

jest.mock("../../../apis");

describe("ViewController", () => {
  beforeEach(() => {
    (deleteWorkOrder as jest.Mock).mockResolvedValue({
      data: { message: "Deleted successfully" },
    });
  });

  it("handleWorkOrderChange triggers state change", () => {
    const mockView = ({ handleWorkOrderChange }) => (
      <input onChange={handleWorkOrderChange} />
    );

    const { getByRole } = render(
      <ViewController workOrders={[]} View={mockView} />,
    );
    const input = getByRole("textbox");
    fireEvent.change(input, { target: { value: "1234" } });

    expect((input as HTMLInputElement).value).toBe("1234");
  });

  it("handleSubmit makes api call", async () => {
    const mockView = ({ handleSubmit, handleWorkOrderChange }) => (
      <form onSubmit={handleSubmit}>
        <input onChange={handleWorkOrderChange} />
        <button type="submit">Submit</button>
      </form>
    );

    const { getByRole } = render(
      <ViewController workOrders={[]} View={mockView} />,
    );
    const input = getByRole("textbox");
    const submitButton = getByRole("button");

    fireEvent.change(input, { target: { value: "1234" } });
    fireEvent.click(submitButton);

    // wait for promises to resolve
    await waitFor(() => {
      expect(deleteWorkOrder).toHaveBeenCalledWith("1234");
    });
  });
});
