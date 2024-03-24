import type { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "@clerk/nextjs/server";

export function authGuard(
  fn: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { userId } = getAuth(req);

    if (!userId) {
      console.log(`Unauthorized request to ${req.url}`);
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    return fn(req, res);
  };
}
