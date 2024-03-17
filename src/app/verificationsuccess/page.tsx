import Image from "next/image";
import checkmark from "../../../public/accept.png";

export default function UploadSuccess() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="mb-2">
        <Image src={checkmark} alt="checkmark" className="max-w-xs" width={200} height={200} />
      </div>
      <p className="text-large text-center">
        Verification complete. You may now close this tab.
      </p>
    </div>
  );
}
