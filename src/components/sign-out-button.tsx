import { useClerk } from "@clerk/clerk-react";
import { useRouter } from "next/router";

const SignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="text-white font-bold border-2 border-white-300">
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  );
};

export default SignOutButton;
