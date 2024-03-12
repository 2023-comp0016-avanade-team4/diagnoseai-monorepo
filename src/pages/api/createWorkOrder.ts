import type { NextApiRequest, NextApiResponse } from 'next';
import { WorkOrder } from '../../models/workOrderModel';
import { authGuard } from './authGuard';
import { ConversationStatus } from '../../models/conversationStatus';
import { v4 as uuid4 } from 'uuid';

async function createWorkOrder(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === 'POST') {
    try {
      // HACK: There is a model way to do it. I'll have to change it
      // after the demo lazy, so I'm doing this instead
      const order_id = uuid4();
      const conversation_id = uuid4();
      const { user_id, machine_id, task_name, task_desc } = req.body;

      await ConversationStatus.create({
        conversation_id,
        status: 'NOT_COMPLETED',
      });

      await WorkOrder.create({
        order_id,
        user_id,
        conversation_id,
        machine_id,
        task_name,
        task_desc,
      });

      res.status(200).json({ message: 'Work order created successfully' });
    } catch (error) {
      console.error('Error creating work order:', error);
      res.status(500).json({ message: 'Error creating work order' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

export default authGuard(createWorkOrder);
