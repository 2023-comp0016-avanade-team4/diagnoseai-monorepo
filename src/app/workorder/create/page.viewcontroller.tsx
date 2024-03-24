"use client";
import { useState, useEffect } from "react";
import { fetchMachines } from "@store/reducers/machinesReducer";
import { useAppDispatch, useAppSelector } from "@store/hook";
import { ClientPageViewProps } from "./page.view";
import { createWorkOrder } from "@/apis";

interface User {
  id: string;
  email: string;
}

export const ClientPageViewController = ({
  users,
  View,
}: {
  users: User[];
  View: React.FC<ClientPageViewProps>;
}) => {
  const [user_id, setUserId] = useState("");
  const [machine_id, setMachineId] = useState("");
  const [task_name, setTaskName] = useState("");
  const [task_desc, setTaskDesc] = useState("");
  const [response, setResponse] = useState("");

  const dispatch = useAppDispatch();
  const machines = useAppSelector((state) => state.machines.machines);
  useEffect(() => {
    fetchMachines(dispatch);
  }, [dispatch]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (
      user_id == "" ||
      machine_id == "" ||
      task_name == "" ||
      task_desc == ""
    ) {
      setResponse("Please fill in all fields");
      return;
    }

    const res = await createWorkOrder(
      user_id,
      machine_id,
      task_name,
      task_desc,
    );
    setResponse(res.data.message);
    setTaskName("");
    setTaskDesc("");
    setTimeout(() => {
      setResponse("");
    }, 5000);
  };

  return (
    <View
      users={users}
      machines={machines}
      response={response}
      handleSubmit={handleSubmit}
      setUserId={setUserId}
      setMachineId={setMachineId}
      setTaskName={setTaskName}
      setTaskDesc={setTaskDesc}
      task_desc={task_desc}
      task_name={task_name}
    />
  );
};
