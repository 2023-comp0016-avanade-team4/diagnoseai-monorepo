/*
  The UUID referred here is the index of the uploaded file.

  As of writing (2024-03-24), DiagnoseAI uses this index as both the
  Cognitive Search index and Azure Blob Storage filename, so it is
  multi-purpose.
*/

interface UUIDAction {
  type: string;
  payload: string;
}

interface UUIDState {
  value: string | null;
}

const initialState = {
  value: null,
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
