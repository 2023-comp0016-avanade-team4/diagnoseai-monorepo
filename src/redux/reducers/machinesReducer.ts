import Machine from '../../types/machine';
import { useAppDispatch } from '../hook';
import axios from 'axios';
import { AppDispatch } from '../store';

// Define action types

interface MachinesAction {
  type: string;
  payload: Machine[];
}

// Define initial state for machines
const initialState: Machine[] = [];

// Machines reducer
export const machinesReducer = (state = initialState, action: MachinesAction): Machine[] => {
  switch (action.type) {
    case 'SET_MACHINES':
      return action.payload;
    default:
      return state;
  }
};

export const setMachines = (machines: Machine[]) => ({
  type: 'SET_MACHINES',
  payload: machines,
});

export const fetchMachines = async (dispatch: AppDispatch) => {
  const response = await axios.get("/api/getMachines");
  dispatch(setMachines(response.data as Machine[]));
}
