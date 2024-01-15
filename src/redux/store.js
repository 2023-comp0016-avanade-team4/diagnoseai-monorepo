import { createStore, combineReducers } from 'redux';
import uuidReducer from './uuidReducer';

const rootReducer = combineReducers({
  uuid: uuidReducer,
});

const store = createStore(rootReducer);

export default store;
