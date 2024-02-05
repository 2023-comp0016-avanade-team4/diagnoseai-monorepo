"use client";

import { Skeleton } from "@nextui-org/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { backOff } from "exponential-backoff";

export default function UploadSuccess() {
  // TODO: Whoever is doing the backend, this page should redirect to /validate
  // after it receives all required validation data

  const router = useRouter();

  useEffect(() => {
    // TODO: Eventually, use the actual index from the store
    const searchIndex = "validation-index";
    const pathname = window.location.pathname;

    const pollingFn = async () => {
      await backOff(
        async () => {
          if (window.location.pathname !== pathname) {
            return false;
          }

          let response = await fetch(
            `/api/processingStatus?searchIndex=${searchIndex}`,
            {
              method: "GET",
            }
          );

          response.json().then((data) => {
            if (data.ready) {
              router.replace("/validate");
              return true;
            }
          });

          throw Error("Index not ready");
        },
        {
          delayFirstAttempt: true,
          startingDelay: 5000,
          numOfAttempts: 100,
          maxDelay: 30000,
        }
      );
    };

    pollingFn();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Skeleton className="h-full w-full"></Skeleton>
    </div>
  );
}
