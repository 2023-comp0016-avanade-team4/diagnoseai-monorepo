'use client'

import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMachines } from "../../redux/reducers/machinesReducer";
import { selectMachine } from "../../redux/reducers/selectedMachineReducer";
import { RootState } from "../../redux/store";
import Machine from "../../types/machine";
import { Skeleton } from "@nextui-org/react";
import { Select, SelectItem } from "@nextui-org/react";

const MachineList = () => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  useEffect(() => {
    axios
      .get("/api/getMachines")
      .then((response) => {
        dispatch(setMachines(response.data as Machine[]));
        setIsLoading(false);
      })
      .catch((error) => {
        console.log("Error fetching machines: " + error);
      });
  }, [dispatch]);

  const { machines, selectedMachine } = useSelector((state: RootState) => ({
    machines: state.machines,
    selectedMachine: state.selectedMachine,
  }));

  const handleMachineChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value != "")
      dispatch(
        selectMachine(
          machines.filter(
            (machine) => machine.machine_id === event.target.value,
          )[0],
        ),
      );
  };

  return (
    <Skeleton className="rounded-lg" isLoaded={!isLoading}>
      <Select
        className="w-full text-xl text-black"
        id="machine"
        onChange={handleMachineChange}
        placeholder="Select a machine"
        items={machines}
        selectedKeys={selectedMachine ? [selectedMachine.machine_id] : []}
      >
        {(machine) => (
          <SelectItem
            key={machine.machine_id}
            textValue={machine.manufacturer + " " + machine.model}
          >
            {machine.manufacturer} {machine.model}
          </SelectItem>
        )}
      </Select>
    </Skeleton>
  );
};

export default MachineList;
