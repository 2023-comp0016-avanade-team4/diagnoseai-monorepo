/*
  Contains the semantics of the store used for the application.
  Exports some useful typed helpers for the store; the rest of the
  application must use these.
*/

import { configureStore, combineReducers } from "@reduxjs/toolkit";
import uuidReducer from "./reducers/uuidReducer";
import { machinesReducer } from "./reducers/machinesReducer";

const rootReducer = combineReducers({
  uuid: uuidReducer,
  machines: machinesReducer,
});

export const makeStore = () => {
  return configureStore({
    reducer: rootReducer,
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
