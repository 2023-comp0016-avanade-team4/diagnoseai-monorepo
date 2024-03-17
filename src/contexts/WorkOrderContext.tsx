import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { showToastWithRefresh } from "@/components/toast-with-refresh";
import { nextTick } from "process";

export interface WorkOrder {
  order_id: string;
  machine_id: string;
  machine_name: string;
  conversation_id: string;
  task_name: string;
  task_desc: string;
  resolved: "COMPLETED" | "NOT_COMPLETED";
}

type WorkOrderContextState = {
  current: WorkOrder | null;
  workOrders: WorkOrder[];
  setCurrent: (state: WorkOrder | null) => void;
  refreshOrders: () => Promise<void>;
  markWorkOrderAsDone: (workOrderId: string) => Promise<void>;
  markWorkOrderAsNotDone: (workOrderId: string) => Promise<void>;
  isProviderBusy: boolean;
};

export const WorkOrderContext = createContext<WorkOrderContextState>({
  current: null,
  workOrders: [],
  setCurrent: (_state) => {},
  refreshOrders: async () => {},
  markWorkOrderAsDone: async (_workOrderId: string) => {},
  markWorkOrderAsNotDone: async (_workOrderId: string) => {},
  isProviderBusy: false,
});

type WorkOrderProviderProps = {
  children: React.ReactNode;
};

export const WorkOrderProvider: React.FC<WorkOrderProviderProps> = ({
  children,
}) => {
  const [current, setCurrent] = useState<WorkOrder | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isProviderBusy, setIsProviderBusy] = useState(false); // for frontend to show loading
  const refreshOrders = async () => {
    setIsProviderBusy(true);
    try {
      const response = await axios.get("/api/workOrders");
      const workOrder = response.data;
      setWorkOrders(workOrder as WorkOrder[]);
      if (workOrder.length > 0) {
        setCurrent(workOrder[0]);
      } else {
        showToastWithRefresh(
          "You do not have any work orders! Please contact an administrator to add work orders to your account.");
      }
    } catch (error) {
      console.error("Error fetching WorkOrder:", error);
      showToastWithRefresh(
        `Error fetching work order: ${error}, please refresh.`
      );
    }
    setIsProviderBusy(false);
  };

  const markWorkOrder = useCallback(async (workOrderId: string, done: boolean) => {
    const workOrder = workOrders.find((order) => order.order_id === workOrderId);
    if (!workOrder) {
      console.error("Work order not found");
      return;
    }

    setWorkOrders(workOrders.map((order) => {
      if (order.order_id === workOrderId) {
        const newOrder = { ...order, resolved: done ? "COMPLETED" : "NOT_COMPLETED" } as WorkOrder;
        // NOTE: This needs to run in the next tick, otherwise React
        // doesn't pick it up on time to update the UI
        nextTick(() => {
          setCurrent(newOrder);
        });

        return newOrder;
      }
      return order;
    }))

    try {
      await axios.post(`/api/chatDone?conversationId=${workOrder.conversation_id}&done=${done}`);
    } catch (error) {
      setWorkOrders(workOrders.map((order) => {
        if (order.order_id === workOrderId) {
          nextTick(() => {
            setCurrent(workOrder);
          });

          return { ...workOrder };
        }
        return order;
      }))
      console.error("Error marking conversation done:", error);
    }
  }, [workOrders]);

  useEffect(() => {
    refreshOrders();
  }, []);

  return (
    <WorkOrderContext.Provider
      value={{
        current,
        setCurrent,
        workOrders,
        refreshOrders,
        markWorkOrderAsDone: id => markWorkOrder(id, true),
        markWorkOrderAsNotDone: id => markWorkOrder(id, false),
        isProviderBusy
      }}
    >
      {children}
    </WorkOrderContext.Provider>
  );
};

export const useWorkOrder = () => {
  const context = useContext(WorkOrderContext);
  if (!context) {
    throw new Error("useWorkOrder must be used within a WorkOrderProvider");
  }
  return context;
};
