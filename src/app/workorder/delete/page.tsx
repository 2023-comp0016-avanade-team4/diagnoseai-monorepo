"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import WorkOrder from "../../../types/workOrder";
import { Select, SelectSection, SelectItem, Input, Button } from "@nextui-org/react";

const Page = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [order_id, setOrder_id] = useState<string>("");
  const [response, setResponse] = useState("");

  useEffect(() => {
    axios
      .get("/api/getWorkOrders")
      .then((response) => {
        setWorkOrders(response.data as WorkOrder[]);
      })
      .catch((error) => {
        console.log("Error fetching work orders: " + error);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.delete("/api/deleteWorkOrder", {
      data: { order_id },
    });
    setResponse(res.data.message);
  };

  const handleWorkOrderChange = (event) => {
    setOrder_id(event.target.value);
  };

  return (
    <div className="w-100 h-100 text-center m-5">
      <form className="flex flex-col gap-4 w-100 h-100 jusity-items-center items-center place-content-center" onSubmit={handleSubmit}>
        <h1 className="text-4xl py-5">Delete a work order</h1>
        <Select items={workOrders} label="Work Order" placeholder="Select a work order" isRequired onChange={handleWorkOrderChange}>
          {(workOrder) => <SelectItem key={workOrder.order_id} value={workOrder.order_id}>{workOrder.order_id.substring(0, 8)}</SelectItem>}
        </Select>
        <Button type="submit" color="danger">Delete</Button>
      </form>
      <div>{response}</div>
    </div >
  );
};

export default Page;
