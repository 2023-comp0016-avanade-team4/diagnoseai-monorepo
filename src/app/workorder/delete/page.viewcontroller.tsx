"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import WorkOrder from "@/types/workOrder";
import { PageViewProps } from "./page.view";
import { deleteWorkOrder, fetchWorkOrders } from "@/apis";

export interface ViewControllerProps {
  View: React.FC<PageViewProps>;
}

// View controller for the page
export function ViewController({ View }: ViewControllerProps) {
  const [orderId, setOrderId] = useState<string>("");
  const [response, setResponse] = useState("");
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchWorkOrders()
      .then((response) => {
        setWorkOrders(response.data as WorkOrder[]);
      })
      .catch((error) => {
        console.log("Error fetching work orders: " + error);
      });
  }, []);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (orderId === "") {
      setResponse("Please select a work order to delete");
      return;
    }

    const res = await deleteWorkOrder(orderId);
    setResponse(res.data.message);
    setOrderId("");
    router.refresh();
  };

  const handleWorkOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOrderId(e?.target?.value || "");
  };

  return (
    <View
      workOrders={workOrders}
      response={response}
      handleSubmit={handleSubmit}
      handleWorkOrderChange={handleWorkOrderChange}
    />
  );
}
