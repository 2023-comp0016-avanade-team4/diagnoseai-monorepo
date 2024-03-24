import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { ClientPageViewController } from "./page.viewcontroller";
import { createWorkOrder } from "@/apis";
import configureMockStore from "redux-mock-store";

jest.mock("../../../apis", () => ({
  createWorkOrder: jest.fn(),
}));

jest.mock("../../../redux/reducers/machinesReducer", () => ({
  fetchMachines: jest.fn(),
}));

describe("ClientPageViewController", () => {
  const MockView = ({
    handleSubmit,
    setUserId,
    setMachineId,
    setTaskName,
    setTaskDesc,
  }) => (
    <>
      <input onChange={(e) => setUserId(e.target.value)} data-testid="userId" />
      <input
        onChange={(e) => setMachineId(e.target.value)}
        data-testid="machineId"
      />
      <input
        onChange={(e) => setTaskName(e.target.value)}
        data-testid="taskName"
      />
      <input
        onChange={(e) => setTaskDesc(e.target.value)}
        data-testid="taskDesc"
      />
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
  const mockStore = configureMockStore([]);
  const store = mockStore({
    machines: {
      machines: [
        { id: "1", name: "machine1" },
        { id: "2", name: "machine2" },
      ],
    },
  });

  const users = [
    { id: "1", email: "test1@test.com" },
    { id: "2", email: "test2@test.com" },
  ];
  const machines = ["machine1", "machine2"];

  beforeEach(() => {
    (createWorkOrder as jest.Mock).mockClear();
    (createWorkOrder as jest.Mock).mockResolvedValue({
      data: { message: "Task Created" },
    });
  });

  it("submits form with the entered values", async () => {
    render(
      <Provider store={store}>
        <ClientPageViewController
          users={users}
          View={MockView}
        ></ClientPageViewController>
      </Provider>,
    );

    const userIdField = screen.getByTestId("userId");
    const machineIdField = screen.getByTestId("machineId");
    const taskNameField = screen.getByTestId("taskName");
    const taskDescField = screen.getByTestId("taskDesc");

    fireEvent.change(userIdField, { target: { value: users[0].id } });
    fireEvent.change(machineIdField, { target: { value: machines[0] } });
    fireEvent.change(taskNameField, { target: { value: "Test Task" } });
    fireEvent.change(taskDescField, { target: { value: "Test Description" } });

    const submitButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createWorkOrder).toHaveBeenCalledWith(
        users[0].id,
        machines[0],
        "Test Task",
        "Test Description",
      );
    });
  });

  it("checks for empty fields before submitting", async () => {
    render(
      <Provider store={store}>
        <ClientPageViewController
          users={users}
          View={MockView}
        ></ClientPageViewController>
      </Provider>,
    );

    const userIdField = screen.getByTestId("userId");
    const machineIdField = screen.getByTestId("machineId");
    const taskNameField = screen.getByTestId("taskName");
    const taskDescField = screen.getByTestId("taskDesc");

    fireEvent.change(userIdField, { target: { value: "" } });
    fireEvent.change(machineIdField, { target: { value: machines[0] } });
    fireEvent.change(taskNameField, { target: { value: "" } });
    fireEvent.change(taskDescField, { target: { value: "" } });

    const submitButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createWorkOrder).not.toHaveBeenCalled();
    });
  });
});
