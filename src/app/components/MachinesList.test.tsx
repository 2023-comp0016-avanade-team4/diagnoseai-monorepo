import { render, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureMockStore from "redux-mock-store";
import { MachineListController } from "./MachinesList";
import { RootState } from "@store/store";
import Machine from "@/types/machine";
import { fetchMachines } from "@/apis";

const mockMachines: Machine[] = [
  { machine_id: "1", manufacturer: "Test1", model: "Model1" },
  { machine_id: "2", manufacturer: "Test2", model: "Model2" },
];

const mockState: Partial<RootState> = {
  machines: { machines: mockMachines, selectedMachine: mockMachines[0] },
};

const mockDispatch = jest.fn();
jest.mock("../../redux/hook", () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: any) => selector(mockState),
}));

jest.mock("../../apis", () => {
  return {
    fetchMachines: jest.fn(),
  };
});

const mockStore = configureMockStore([])(mockState);

describe("MachineListController", () => {
  const View = ({ handleMachineChange }) => (
    <select data-testid="select" onChange={handleMachineChange} />
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchMachines as jest.Mock).mockResolvedValue({ data: mockMachines });
  });

  it("fetches machines and sets ID on change", async () => {
    const { getByTestId } = render(
      <Provider store={mockStore}>
        <MachineListController View={View} />
      </Provider>,
    );

    await waitFor(() => expect(fetchMachines).toHaveBeenCalled());

    expect(mockDispatch).toHaveBeenCalled();

    fireEvent.change(getByTestId("select") as Element, {
      target: { value: "2" },
    });
    await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
  });
});
