import "server-only";
import { WorkOrder as WorkOrderModel } from "@/models/workOrderModel";

// Server Controller for the page. This controller fetches the work
// orders without requiring an api, and is must hence be a server
// component.
// (Trivial fetching utilitiy, does not require testing)
export const useController = async () => {
  try {
    const workOrders = (await WorkOrderModel.findAll()).map((workOrder) =>
      workOrder.toJSON(),
    );
    return { workOrders };
  } catch (error) {
    console.error("Error fetching work orders: " + error);
    return { workOrders: [] };
  }
};
