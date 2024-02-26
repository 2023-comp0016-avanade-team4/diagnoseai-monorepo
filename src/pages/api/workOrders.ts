import axios from "axios";
import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, getToken } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const config = {
    method: "get",
    // TODO: use userId from Clerk. We're doing this at the moment
    // because sending messages still does not involve the user ID (yet)
    url: `${process.env.WORK_ORDERS_URL}?user_id=${userId}`,
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
    console.error("Error fetching work orders:", error);
    return res.status(500).json({ error: "Error fetching work orders" });
  }
}
