interface UUIDAction {
  type: string;
  payload: string;
}

interface UUIDState {
  value: string;
}

const initialState = {
  value: "test",
} as UUIDState;

const uuidReducer = (state = initialState, action: UUIDAction) => {
  switch (action.type) {
    case "SET_UUID":
      return {
        ...state,
        value: action.payload,
      };
    default:
      return state;
  }
};

export const setUUID = (uuid: string) => ({
  type: "SET_UUID",
  payload: uuid,
});

export default uuidReducer;
