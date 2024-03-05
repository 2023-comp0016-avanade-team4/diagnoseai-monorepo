import { getAuth } from '@clerk/nextjs/server';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, getToken } = getAuth(req);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!('conversationId' in req.query)) {
    return res.status(400).json({ error: 'conversationId is required' });
  }

  const config = {
    method: "post",
    url: process.env.CHAT_DONE_URL,
    params: {
      'conversation_id': req.query['conversationId']
    },
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.OCP_APIM_SUBSCRIPTION_KEY,
      "Content-Type": "application/json",
      "Auth-Token": await getToken(),
    },
  };

  try {
    const response = await axios(config);
    if (response.status !== 200) {
      return res.status(response.status).json({
        error: 'Error fetching WebSocket URL'
      });
    }
    return res.status(200).json({ message: 'Conversation marked as completed' });
  } catch (error) {
    return res.status(500).json({ error: 'Cannot mark conversation as completed' });
  }
}
