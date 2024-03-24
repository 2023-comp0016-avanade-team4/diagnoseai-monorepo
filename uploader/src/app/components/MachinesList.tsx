"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@store/hook";
import { setMachines, selectMachine } from "@store/reducers/machinesReducer";
import { RootState } from "@store/store";
import Machine from "@/types/machine";
import { Skeleton } from "@nextui-org/react";
import { Select, SelectItem } from "@nextui-org/react";
import { UnknownAction } from "redux";
import { fetchMachines } from "@/apis";

export interface MachineListViewProps {
  isLoading: boolean;
  machines: Machine[];
  selectedMachine: Machine | null;
  handleMachineChange:
    | ((event: React.ChangeEvent<HTMLSelectElement>) => void)
    | undefined;
}

export const MachineListController = ({
  View,
}: {
  View: React.FC<MachineListViewProps>;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useAppDispatch();
  useEffect(() => {
    fetchMachines()
      .then((response) => {
        dispatch(setMachines(response.data as Machine[]));
        setIsLoading(false);
      })
      .catch((error) => {
        console.log("Error fetching machines: " + error);
      });
  }, [dispatch]);

  const { machines, selectedMachine } = useAppSelector((state: RootState) => ({
    machines: state.machines.machines,
    selectedMachine: state.machines.selectedMachine,
  }));

  const handleMachineChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (event.target.value != "")
      dispatch(
        selectMachine(
          machines.filter(
            (machine) => machine.machine_id === event.target.value,
          )[0],
        ) as unknown as UnknownAction,
      );
  };

  return (
    <View
      isLoading={isLoading}
      machines={machines}
      selectedMachine={selectedMachine}
      handleMachineChange={handleMachineChange}
    />
  );
};

export const MachineListView = ({
  isLoading,
  machines,
  selectedMachine,
  handleMachineChange,
}: MachineListViewProps) => {
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

export const MachineList = () => (
  <MachineListController View={MachineListView} />
);
export default MachineList;
