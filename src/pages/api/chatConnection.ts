import axios from "axios";
import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { getToken } = getAuth(req);

  const authToken = await getToken();
  if (!authToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const data = JSON.stringify({
    userId: "123", // Replace with dynamic user ID if necessary
  });

  try {
    const response = await axios({
      method: "post",
      url: process.env.CHAT_CONNECTION_URL,
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.OCP_APIM_SUBSCRIPTION_KEY,
        "Content-Type": "application/json",
        "Auth-Token": authToken,
      },
      data,
    });
    res.status(200).json({ wsUrl: response.data.wsUrl });
  } catch (error) {
    console.error("Error fetching WebSocket URL:", error);
    res.status(500).json({ error: "Error fetching WebSocket URL" });
  }
}
