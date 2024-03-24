import { clerkClient } from "@clerk/nextjs";
import { ClientPageView } from "./page.view";
import { ClientPageViewController } from "./page.viewcontroller";

// This is a server-side component, and also acts as the Server-Side controller.
// Does not need testing, a trivial fetching utility.
const Page = async () => {
  const users = await clerkClient.users.getUserList({ limit: 1000 });
  return (
    <ClientPageViewController
      users={users.map((user) => ({
        id: user.id,
        email: user.emailAddresses[0].emailAddress,
      }))}
      View={ClientPageView}
    />
  );
};

export default Page;
