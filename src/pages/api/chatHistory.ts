import axios from 'axios';
import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, getToken } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const data = JSON.stringify({
    conversation_id: req.query.conversation_id,
  });

  const config = {
    method: "post",
    url: `${process.env.CHAT_HISTORY_URL}?conversation_id=${req.query.conversation_id}`,
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.OCP_APIM_SUBSCRIPTION_KEY,
      "Content-Type": "application/json",
      "Auth-Token": await getToken(),
    },
  };

  try {
    const response = await axios(config);
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching history:", error);
    return res.status(500).json({ error: 'Error fetching history' });
  }
}
