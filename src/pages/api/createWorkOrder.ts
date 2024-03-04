import type { NextApiRequest, NextApiResponse } from "next";
import { WorkOrder } from "../../models/workOrderModel";
import { authGuard } from "./authGuard";
import { v4 as uuidv4 } from "uuid";

async function createWorkOrder(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === "POST") {
    try {
      const { order_id, user_id, machine_id, task_name, task_desc } = req.body;
      const conversation_id = uuidv4();

      // Create a new work order using Sequelize model
      await WorkOrder.create({
        order_id,
        user_id,
        conversation_id,
        machine_id,
        task_name,
        task_desc,
      });

      res.status(200).json({ message: "Work order created successfully" });
    } catch (error) {
      console.error("Error creating work order:", error);
      res.status(500).json({ message: "Error creating work order" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export default authGuard(createWorkOrder);
