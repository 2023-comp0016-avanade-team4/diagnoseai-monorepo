const initialState = {
    value: "test",
  };
  
  const uuidReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'SET_UUID':
        return {
          ...state,
          value: action.payload,
        };
      default:
        return state;
    }
  };
  
  export const setUUID = (uuid) => ({
    type: 'SET_UUID',
    payload: uuid,
  });
  
  export default uuidReducer;
  