"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import WorkOrder from "../../../types/workOrder";

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
    <div>
      <form onSubmit={handleSubmit}>
        <select value={order_id} onChange={handleWorkOrderChange}>
          <option value="">Select a work order</option>
          {workOrders.map((workOrder) => (
            <option key={workOrder.order_id} value={workOrder.order_id}>
              {workOrder.task_name}
            </option>
          ))}
        </select>

        <button type="submit">Submit</button>
      </form>
      <div>{response}</div>
    </div>
  );
};

export default Page;
