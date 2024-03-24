"use client";
import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@store/hook";
import { fetchMachines } from "@store/reducers/machinesReducer";
import { MachinesPageViewProps } from "./page.view";
import { deleteMachine } from "@/apis";

export const PageController = ({
  View,
}: {
  View: React.FC<MachinesPageViewProps>;
}) => {
  const machines = useAppSelector((state) => state.machines.machines);
  const dispatch = useAppDispatch();

  useEffect(() => {
    fetchMachines(dispatch);
  }, [dispatch]);

  const [machineId, setMachineId] = useState<string>("");
  const [response, setResponse] = useState("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (machineId === "") {
      setResponse("Please select a machine");
      return;
    }

    const res = await deleteMachine(machineId);
    setResponse(res.data.message);
    fetchMachines(dispatch);
  };

  const handleMachineChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setMachineId(event?.target.value);
  };

  return (
    <View
      machines={machines}
      response={response}
      handleSubmit={handleSubmit}
      handleMachineChange={handleMachineChange}
    />
  );
};
