import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import configureMockStore from "redux-mock-store";
import { Provider } from "react-redux";

import { PageController } from "./page.viewcontroller"; // Adjust to your real path
import { deleteMachine } from "@/apis";

jest.mock("../../../apis", () => {
  return {
    deleteMachine: jest.fn(),
  };
});

jest.mock("../../../redux/reducers/machinesReducer", () => ({
  fetchMachines: jest.fn(),
}));

const mockStore = configureMockStore([]);
const initialState = {
  machines: {
    machines: [{ id: "machine1", name: "Machine 1" }],
    selectedMachineId: "machine1",
  },
};

describe("MachineDeletePageController", () => {
  const View = ({ handleSubmit, handleMachineChange }) => {
    return (
      <form onSubmit={handleSubmit}>
        Test Form<input data-testid="hi" onChange={handleMachineChange}></input>
      </form>
    );
  };

  const store = mockStore(initialState);

  beforeEach(() => {
    (deleteMachine as jest.Mock).mockClear();
    (deleteMachine as jest.Mock).mockResolvedValueOnce({
      data: { message: "Machine Deleted Successfully" },
    });
  });

  it("tests form submission", async () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <PageController View={View} />
      </Provider>,
    );

    const input = getByTestId("hi");
    fireEvent.change(input, { target: { value: "machine1" } });
    const form = getByText("Test Form");
    fireEvent.submit(form);

    await waitFor(() => expect(deleteMachine).toHaveBeenCalledWith("machine1"));
  });

  it("tests form submission when nothing is selected", async () => {
    const { getByText } = render(
      <Provider store={store}>
        <PageController View={View} />
      </Provider>,
    );

    const form = getByText("Test Form");
    fireEvent.submit(form);

    await waitFor(() => expect(deleteMachine).not.toHaveBeenCalled());
  });
});
