import { authMiddleware } from "@clerk/nextjs";

// protect all routes (intended)
export default authMiddleware({});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
