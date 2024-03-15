import type { NextApiRequest, NextApiResponse } from 'next';
import { authGuard } from './authGuard';
import { clerkClient } from '@clerk/nextjs'

async function getAllUsers(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method === 'GET') {
    const users = await clerkClient.users.getUserList();
    res.status(200).json(users);
  }
}

export default authGuard(getAllUsers);
