"use client";
import { Select, SelectItem, Button } from "@nextui-org/react";

export interface PageViewProps {
  handleSubmit: ((e: any) => void) | undefined;
  handleWorkOrderChange:
    | ((event: React.ChangeEvent<HTMLSelectElement>) => void)
    | undefined;
  workOrders: { order_id: string; task_name: string }[];
  response: string;
}

// View-only component, does not require testing
export const PageView = ({
  handleSubmit,
  handleWorkOrderChange,
  workOrders,
  response,
}: PageViewProps) => (
  <div className="w-100 h-100 text-center m-5">
    <form
      className="flex flex-col gap-4 w-100 h-100 jusity-items-center items-center place-content-center"
      onSubmit={handleSubmit}
    >
      <h1 className="text-4xl py-5">Delete a work order</h1>
      <Select
        label="Work Order"
        placeholder="Select a work order"
        isRequired
        onChange={handleWorkOrderChange}
      >
        {workOrders.map((workOrder) => (
          <SelectItem key={workOrder.order_id} value={workOrder.order_id}>
            {workOrder.task_name}
          </SelectItem>
        ))}
      </Select>
      <Button type="submit" color="danger">
        Delete
      </Button>
    </form>
    <div>{response}</div>
  </div>
);
