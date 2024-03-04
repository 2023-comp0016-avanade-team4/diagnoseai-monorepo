import { NextApiRequest, NextApiResponse } from "next";
import { WorkOrder } from "../../models/workOrderModel";
import { authGuard } from "./authGuard";

async function getWorkOrders(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const workorders = await WorkOrder.findAll();
      res.status(200).json(workorders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed, use GET method" });
  }
}

export default getWorkOrders;
