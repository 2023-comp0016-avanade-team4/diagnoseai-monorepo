import { getAuth } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { getToken } = getAuth(req);
  if (!getToken) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const token = await getToken();

  // send the token in the response
  res.status(200).json({ token });
}
