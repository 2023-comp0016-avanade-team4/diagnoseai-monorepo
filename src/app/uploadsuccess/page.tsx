'use client'

import { Skeleton } from "@nextui-org/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UploadSuccess() {
  // TODO: Whoever is doing the backend, this page should redirect to /validate
  // after it receives all required validation data

  const router = useRouter();

  useEffect(() => {
    const timeoutFn = () => {
      router.replace('/validate');
    }
    setTimeout(timeoutFn, 1000);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Skeleton className="h-full w-full"></Skeleton>
    </div>
  );
}
