"use client"
import { useState } from 'react';
import axios from 'axios';

const Page = () => {
  const [order_id, setOrder_id] = useState<string>('');
  const [response, setResponse] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.delete('/api/deleteWorkOrder', {
      data: { order_id },
    });
    setResponse(res.data);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={order_id}
          onChange={(e) => setOrder_id(e.target.value)}
          placeholder="order_id"
        />
        <button type="submit">Submit</button>
      </form>
      <div>{response.message}</div>
    </div>
  );
};

export default Page;
