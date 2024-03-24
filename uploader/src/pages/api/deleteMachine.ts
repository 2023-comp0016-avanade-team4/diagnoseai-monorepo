import type { NextApiRequest, NextApiResponse } from "next";
import { Machine } from "../../models/workOrderModel";
import { authGuard } from "./authGuard";

async function deleteWorkOrder(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === "DELETE") {
    try {
      const { machineId } = req.body;

      if (!machineId) {
        return res
          .status(400)
          .json({ message: "Machine ID is required for deletion" });
      }

      const workOrder = await Machine.findByPk(machineId);
      if (!workOrder) {
        return res.status(404).json({ message: "machine not found" });
      }
      await workOrder.destroy();

      res.status(200).json({ message: "machine deleted successfully" });
    } catch (error) {
      console.error("Error deleting machine:", error);
      res.status(500).json({ message: "Error deleting machine" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export default authGuard(deleteWorkOrder);
