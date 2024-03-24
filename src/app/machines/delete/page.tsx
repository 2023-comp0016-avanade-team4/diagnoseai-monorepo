"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAppSelector, useAppDispatch } from "../../../redux/hook";
import { fetchMachines } from "../../../redux/reducers/machinesReducer";
import { Select, SelectSection, SelectItem, Input, Button } from "@nextui-org/react";

const Page = () => {
  const machines = useAppSelector((state) => state.machines.machines);
  const dispatch = useAppDispatch();

  useEffect(() => {
    fetchMachines(dispatch);
  }, [dispatch]);

  const [machineId, set_machineId] = useState<string>("");
  const [response, setResponse] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (machineId === "") {
      setResponse("Please select a machine");
      return;
    }

    const res = await axios.delete("/api/deleteMachine", {
      data: { machine_id: machineId },
    });
    setResponse(res.data.message);
  };

  const handleWorkOrderChange = (event) => {
    set_machineId(event.target.value);
  };

  return (
    <div className="w-100 h-100 text-center m-5">
      <form className="flex flex-col gap-4 w-100 h-100 jusity-items-center items-center place-content-center" onSubmit={handleSubmit}>
        <h1 className="text-4xl py-5">Delete a machine</h1>
        <Select items={machines || undefined} label="Machine" placeholder="Select a machine" isRequired onChange={handleWorkOrderChange}>
          {(machine) => <SelectItem key={machine.machine_id} value={machine.machine_id}>{`${machine.manufacturer} ${machine.model}`}</SelectItem>}
        </Select>
        <Button type="submit" color="danger">Delete</Button>
      </form>
      <div>{response}</div>
    </div >
  );
};

export default Page;
