"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import WorkOrder from "@/types/workOrder";
import { PageViewProps } from "./page.view";
import { deleteWorkOrder } from "@/apis";

export interface ViewControllerProps {
  workOrders: WorkOrder[];
  View: React.FC<PageViewProps>;
}

// View controller for the page
export function ViewController({ workOrders, View }: ViewControllerProps) {
  const [orderId, setOrderId] = useState<string>("");
  const [response, setResponse] = useState("");
  const router = useRouter();

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

  const handleWorkOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
