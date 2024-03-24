interface WorkOrder {
  order_id: string;
  user_id: string;
  conversation_id: string;
  machine_id: string;
  task_name: string;
  task_desc: string;
  created_at: Date;
}

export default WorkOrder;
