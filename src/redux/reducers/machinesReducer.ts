import  Machine  from '../../types/machine';

// Define action types

interface MachinesAction {
    type: string;
    payload: Machine[];
}

// Define initial state for machines
const initialState: Machine[] = [];

// Machines reducer
export const machinesReducer = (state = initialState, action: MachinesAction ): Machine[] => {
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





