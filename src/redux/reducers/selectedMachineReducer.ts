import Machine from "../../types/machine";

// Define action types
interface selectedMachineAction {
  type: string;
  payload: Machine | null;
}

// Define the initial state for selected machine
const initialState: Machine | null = null;

export const selectedMachineReducer = (
  state = initialState,
  action: selectedMachineAction,
) => {
  switch (action.type) {
    case "SELECT_MACHINE":
      return action.payload;
    default:
      return state;
  }
};

export const selectMachine = (machine: Machine) => ({
  type: "SELECT_MACHINE",
  payload: machine,
});
