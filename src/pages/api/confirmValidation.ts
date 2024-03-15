import axios from 'axios';
import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { getToken } = getAuth(req);

  const authToken = await getToken();
  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { validation_index_name, production_index_name } = req.body;
  if (!validation_index_name || !production_index_name) {
    return res.status(400).json({
      error: 'validation_index_name and production_index_name are required'
    });
  }

  const data = JSON.stringify({
    validation_index_name,
    production_index_name
  });


  try {
    const response = await axios({
      method: "post",
      url: process.env.VALIDATE_URL,
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.OCP_APIM_SUBSCRIPTION_KEY,
        "Content-Type": "application/json",
        "Auth-Token": authToken,
      },
      data
    });

    if (response.status !== 200) {
      return res.status(500).json({ error: 'Error moving validation index' });
    }

    res.status(200).json({ message: 'Success' });
  } catch (error) {
    console.error("Error moving validation index:", error);
    res.status(500).json({ error: 'Error fetching WebSocket URL' });
  }
}
