import { configureStore } from '@reduxjs/toolkit';
import uuidReducer from './uuidReducer';

export const makeStore = () => {
  return configureStore({
    reducer: {
      uuid: uuidReducer,
    },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
