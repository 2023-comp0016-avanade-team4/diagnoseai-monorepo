import type { NextApiRequest, NextApiResponse } from 'next';
import { Machine } from '../../models/workOrderModel';
import { authGuard } from './authGuard';
import { v4 as uuid4 } from 'uuid';

async function createMachine(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === 'POST') {
    try {
      // TODO: There is a model way to do it. I'll have to change it
      // after the demo lazy, so I'm doing this instead
      const machine_id = uuid4();
      const { manufacturer, model } = req.body;

      await Machine.create({
        machine_id, manufacturer, model,
      });

      res.status(200).json({ message: 'Machine created successfully' });
    } catch (error) {
      console.error('Error creating machine:', error);
      res.status(500).json({ message: 'Error creating machine' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

export default authGuard(createMachine);
