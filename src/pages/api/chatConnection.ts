import { getAuth } from '@clerk/nextjs/server';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, getToken } = getAuth(req);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = JSON.stringify({
    userId: userId,
  });

  const config = {
    method: "post",
    url: process.env.CHAT_CONNECTION_URL,
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.OCP_APIM_SUBSCRIPTION_KEY,
      "Content-Type": "application/json",
      "Auth-Token": await getToken(),
    },
    data,
  };

  try {
    const response = await axios(config);
    const wsUrl = response.data.wsUrl; // Extract the wsUrl from the response
    return res.status(200).json({ wsUrl });
  } catch (error) {
    console.error("Error fetching WebSocket URL:", error);
    return res.status(500).json({ error: 'Error fetching WebSocket URL' });
  }
}
