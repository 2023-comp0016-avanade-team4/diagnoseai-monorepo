import Image from "next/image";
import checkmark from "../../../public/accept.png";
import { Spinner } from "@nextui-org/react";

export const UploadSuccessView = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="mb-2">
        <Image
          src={checkmark}
          alt="checkmark"
          className="max-w-xs"
          width={200}
          height={200}
        />
      </div>
      <p className="text-large text-center pb-5">
        Your submission will be processed.
      </p>
      <p className="text-center">
        We will send you an email once we&apos;re done.
        <br />
        You can safely close this tab.
        <br />
        Alternatively, please wait a moment, we will redirect you... (may take
        up to 5 minutes)
      </p>
      <Spinner />
    </div>
  );
};
