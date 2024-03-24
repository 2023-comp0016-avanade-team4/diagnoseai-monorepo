"use client";
import { Select, SelectItem, Button } from "@nextui-org/react";

export interface MachinesPageViewProps {
  handleSubmit: ((e: any) => void) | undefined;
  handleMachineChange:
    | ((event: React.ChangeEvent<HTMLSelectElement>) => void)
    | undefined;
  machines: { machine_id: string; manufacturer: string; model: string }[];
  response: string;
}

// No need to unit test: view-only
export const MachinesPageView = ({
  handleSubmit,
  handleMachineChange,
  machines,
  response,
}: MachinesPageViewProps) => (
  <div className="w-100 h-100 text-center m-5">
    <form
      className="flex flex-col gap-4 w-100 h-100 jusity-items-center items-center place-content-center"
      onSubmit={handleSubmit}
    >
      <h1 className="text-4xl py-5">Delete a machine</h1>
      <Select
        items={machines || undefined}
        label="Machine"
        placeholder="Select a machine"
        isRequired
        onChange={handleMachineChange}
      >
        {(machine) => (
          <SelectItem
            key={machine.machine_id}
            value={machine.machine_id}
          >{`${machine.manufacturer} ${machine.model}`}</SelectItem>
        )}
      </Select>
      <Button type="submit" color="danger">
        Delete
      </Button>
    </form>
    <div>{response}</div>
  </div>
);

export default MachinesPageView;
