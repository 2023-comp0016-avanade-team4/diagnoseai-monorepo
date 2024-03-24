"use client";
import { Select, SelectItem, Input, Button } from "@nextui-org/react";

export interface ClientPageViewProps {
  users: { id: string; email: string }[];
  machines: { machine_id: string; manufacturer: string; model: string }[];
  handleSubmit: ((e: any) => void) | undefined;
  setUserId: ((value: string) => void) | undefined;
  setMachineId: ((value: string) => void) | undefined;
  setTaskName: ((value: string) => void) | undefined;
  setTaskDesc: ((value: string) => void) | undefined;
  response: string;
  task_name: string;
  task_desc: string;
}

// Does not need testing, a view-only component
export const ClientPageView = ({
  users,
  machines,
  handleSubmit,
  setUserId,
  setMachineId,
  setTaskName,
  setTaskDesc,
  response,
  task_name,
  task_desc,
}: ClientPageViewProps) => {
  return (
    <div className="w-100 h-100 text-center m-5">
      <h1 className="text-4xl py-5">Create a new task</h1>
      <form
        className="flex flex-col gap-4 w-100 h-100 jusity-items-center items-center place-content-center"
        onSubmit={handleSubmit}
      >
        <Select
          items={users}
          label="User"
          placeholder="Select a user"
          isRequired
          onChange={(e) => setUserId?.(e.target.value)}
        >
          {(user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.email}
            </SelectItem>
          )}
        </Select>
        <Select
          items={machines}
          label="Machine"
          placeholder="Select a machine"
          isRequired
          onChange={(e) => setMachineId?.(e.target.value)}
        >
          {(machine) => (
            <SelectItem
              key={machine.machine_id}
              value={machine.machine_id}
            >{`${machine.manufacturer} ${machine.model}`}</SelectItem>
          )}
        </Select>
        <Input
          type="text"
          value={task_name}
          onChange={(e) => setTaskName?.(e.target.value)}
          isRequired
          placeholder="Enter a task"
        />
        <Input
          type="text"
          value={task_desc}
          onChange={(e) => setTaskDesc?.(e.target.value)}
          isRequired
          placeholder="Enter a task description"
        />
        <Button color="primary" type="submit">
          Submit
        </Button>
      </form>
      <div>{response}</div>
    </div>
  );
};
