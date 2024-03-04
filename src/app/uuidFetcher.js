import React, { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUUID } from "../redux/reducers/uuidReducer";

const UUIDFetcher = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    axios
      .post("/api/fileUpload")
      .then((response) => {
        if (response.status === 200) {
          dispatch(setUUID(response.data.uuid));
        }
      })
      .catch((error) => console.error("Error fetching UUID:", error));
  }, [dispatch]);

  return null; // This component does not render anything
};

export default UUIDFetcher;
