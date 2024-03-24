import Machine from '@/types/machine';
import axios from 'axios';
import { AppDispatch } from '@store/store';

interface MachinesAction {
  type: string;
  payload: Machine[];
}

interface SelectedMachineAction {
  type: string;
  payload: Machine | null;
}

interface MachinesState {
  machines: Machine[];
  selectedMachine: Machine | null;
}


const initialState: MachinesState = {
  machines: [],
  selectedMachine: null,
};

export const machinesReducer = (state = initialState, action: MachinesAction | SelectedMachineAction): MachinesState => {
  switch (action.type) {
    case 'SET_MACHINES':
      return {
        ...state,
        machines: (action as MachinesAction).payload,
      };
    case 'SELECT_MACHINE':
      return {
        ...state,
        selectedMachine: (action as SelectedMachineAction).payload,
      };
    default:
      return state;
  }
};

export const selectMachine = (machine: Machine) => ({
  type: 'SELECT_MACHINE',
  payload: machine,
});

export const selectMachineById = (machines: Machine[], id: string) => {
  const machine = machines.find((machine) => machine.machine_id === id);
  if (machine === undefined) {
    console.error(`machine {id} not found`);
    return null;
  }
  return selectMachine(machine);
};

export const setMachines = (machines: Machine[]) => ({
  type: 'SET_MACHINES',
  payload: machines,
});

export const fetchMachines = async (dispatch: AppDispatch) => {
  const response = await axios.get("/api/getMachines");
  dispatch(setMachines(response.data as Machine[]));
}
