import { NextApiRequest, NextApiResponse } from 'next';
import { Machine } from '../../models/workOrderModel';
import { authGuard } from './authGuard';

async function getMachines(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'GET') {
    try {
      const machines = await Machine.findAll();
      res.status(200).json(machines);
    }
    catch (err) {
      console.error(err.message);
      res.status(500).json({ message: "Internal server error" });
    }
  }
  else {
    res.status(405).json({ message: 'Method not allowed send a get request' });
  }
}

export default authGuard(getMachines);
