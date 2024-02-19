// store.ts

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import uuidReducer from './reducers/uuidReducer';
import { machinesReducer } from './reducers/machinesReducer';
import  {selectedMachineReducer}  from './reducers/selectedMachineReducer';

// Combine all reducers
const rootReducer = combineReducers({
  uuid: uuidReducer,
  machines: machinesReducer,
  selectedMachine: selectedMachineReducer,
});

// Create the store
export const makeStore = () => {
  return configureStore({
    reducer: rootReducer,
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
