'use client'

import { useEffect } from 'react';
import Image from "next/image";
import checkmark from "../../../public/accept.png";
import { Spinner } from "@nextui-org/react";
import { useAppSelector } from '../../redux/hook';
import { useRouter } from "next/navigation";
import axios from 'axios';

export default function UploadSuccess() {
  const { uuid, machine } = useAppSelector((store) => ({
    uuid: store.uuid.value,
    machine: store.selectedMachine?.machine_id
  }));
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      axios.get(`/api/processingStatus?searchIndex=${uuid}`, {
        headers: {
          // disable cache
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Experies': '0'
        }
      })
        .then((response) => response.data)
        .then((data) => {
          if (data.ready) {
            router.replace(`/validate?index=${uuid}&machine=${machine}}`)
          }
        });
    }, 5000);

    return () => clearInterval(interval);
  }, [uuid, machine, router]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="mb-2">
        <Image src={checkmark} alt="checkmark" className="max-w-xs" width={200} height={200} />
      </div>
      <p className="text-large text-center pb-5">
        Your submission will be processed.
      </p>
      <p className="text-center">
        We will send you an email once we&apos;re done.<br />
        You can safely close this tab.<br />
        Alternatively, please wait a moment, we will redirect you... (may take up to 5 minutes)
      </p>

      <Spinner />
    </div >
  );
}
