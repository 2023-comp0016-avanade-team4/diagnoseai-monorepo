"use client"
import { useState } from "react";
import axios from "axios";

const Page = () => {
  const [order_id, setOrder_id] = useState<string>("");
  const [user_id, setUser_id] = useState('');
  const [machine_id, setMachine_id] = useState('');
  const [conversation_id, setConversation_id] = useState('');
  const [task_name, setTask_name] = useState('');
  const [task_desc, setTask_desc] = useState('');
  const [response, setResponse] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.post('/api/createWorkOrder', {
      user_id,
      machine_id,
      task_name,
      task_desc,
    });
    setResponse(res.data);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={user_id}
          onChange={(e) => setUser_id(e.target.value)}
          placeholder="user_id"
        />
        <input
          type="text"
          value={machine_id}
          onChange={(e) => setMachine_id(e.target.value)}
          placeholder="machine_id"
        />
        <input
          type="text"
          value={task_name}
          onChange={(e) => setTask_name(e.target.value)}
          placeholder="task_name"
        />
        <input
          type="text"
          value={task_desc}
          onChange={(e) => setTask_desc(e.target.value)}
          placeholder="task_desc"
        />
        <button type="submit">Submit</button>
      </form>
      <div>{response.message}</div>
    </div>
  );
};

export default Page;
