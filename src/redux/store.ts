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

// Define the type for the store
export type AppStore = ReturnType<typeof makeStore>;

// Define the root state type
export type RootState = ReturnType<AppStore['getState']>;

// Define the type for dispatch
export type AppDispatch = AppStore['dispatch'];
