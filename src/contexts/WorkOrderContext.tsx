import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export interface WorkOrder {
  order_id: string;
  machine_id: string;
  machine_name: string;
  conversation_id: string;
}

type WorkOrderContextState = {
  current: WorkOrder | null;
  workOrders: WorkOrder[];
  setCurrent: (state: WorkOrder | null) => void;
  refreshOrders: () => Promise<void>;
};

export const WorkOrderContext = createContext<WorkOrderContextState>({
  current: null,
  workOrders: [],
  setCurrent: (_state) => {},
  refreshOrders: async () => {},
});

type WorkOrderProviderProps = {
  children: React.ReactNode;
};

export const WorkOrderProvider: React.FC<WorkOrderProviderProps> = ({
  children,
}) => {
  const [current, setCurrent] = useState<WorkOrder | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const refreshOrders = async () => {
    try {
      const response = await axios.get("/api/workOrders");
      const workOrder = response.data;
      setWorkOrders(workOrder as WorkOrder[]);
      if (workOrder.length > 0) {
        setCurrent(workOrder[0]);
      }
    } catch (error) {
      console.error("Error fetching WorkOrder:", error);
    }
  };

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
