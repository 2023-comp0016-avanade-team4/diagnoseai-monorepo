import type { NextApiRequest, NextApiResponse } from 'next';
import { WorkOrder } from '../../models/workOrderModel';
import { authGuard } from './authGuard';

async function deleteWorkOrder(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    if (method === 'DELETE') {
        try {
            const { order_id } = req.body;

            // Check if the order_id is provided
            if (!order_id) {
                return res.status(400).json({ message: 'Order ID is required for deletion' });
            }

            // Find the work order by ID
            const workOrder = await WorkOrder.findByPk(order_id);

            // Check if the work order exists
            if (!workOrder) {
                return res.status(404).json({ message: 'Work order not found' });
            }

            // Delete the work order
            await workOrder.destroy();

            res.status(200).json({ message: 'Work order deleted successfully' });
        } catch (error) {
            console.error('Error deleting work order:', error);
            res.status(500).json({ message: 'Error deleting work order' });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}

export default authGuard(deleteWorkOrder);
