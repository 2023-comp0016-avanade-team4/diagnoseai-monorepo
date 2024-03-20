import { clerkClient } from '@clerk/nextjs'
import ClientPage from './client-page';

// This is a server-side component.
const Page = async () => {
  const users = await clerkClient.users.getUserList({ limit: 1000 });
  return <ClientPage users={users.map(user => ({
    id: user.id,
    email: user.emailAddresses[0].emailAddress,
  }))} />;
};

export default Page;
