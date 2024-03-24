"use client";
import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { fetchMachines } from "../../../redux/reducers/machinesReducer";
import { useAppDispatch, useAppSelector } from "../../../redux/hook";
import type { UserProfile } from '@clerk/nextjs'

import { Select, SelectSection, SelectItem, Input, Button } from "@nextui-org/react";

interface User {
  id: string;
  email: string;
};

const ClientPage = ({ users }: { users: User[] }) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user_id || !machine_id || !task_name || !task_desc) {
      setResponse("Please fill in all fields");
      return;
    }

    const res = await axios.post('/api/createWorkOrder', {
      user_id,
      machine_id,
      task_name,
      task_desc,
    });
    setResponse(res.data.message);
  };

  return (
    <div className="w-100 h-100 text-center m-5">
      <h1 className="text-4xl py-5">Create a new task</h1>
      <form className="flex flex-col gap-4 w-100 h-100 jusity-items-center items-center place-content-center" onSubmit={handleSubmit}>
        <Select
          items={users}
          label="User"
          placeholder="Select a user"
          isRequired
          onChange={(e) => setUserId(e.target.value)}
        >
          {(user) => <SelectItem key={user.id} value={user.id}>{user.email}</SelectItem>}
        </Select>
        <Select
          items={machines}
          label="Machine"
          placeholder="Select a machine"
          isRequired
          onChange={(e) => setMachineId(e.target.value)}
        >
          {(machine) => <SelectItem key={machine.machine_id} value={machine.machine_id}>{`${machine.manufacturer} ${machine.model}`}</SelectItem>}
        </Select>
        <Input
          type="text"
          value={task_name}
          onChange={(e) => setTaskName(e.target.value)}
          isRequired
          placeholder="Enter a task"
        />
        <Input
          type="text"
          value={task_desc}
          onChange={(e) => setTaskDesc(e.target.value)}
          isRequired
          placeholder="Enter a task description"
        />
        <Button color="primary" type="submit">Submit</Button>
      </form>
      <div>{response}</div>
    </div >
  );
};

export default ClientPage;
