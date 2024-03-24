"use client";

import { useEffect } from "react";
import { useAppSelector } from "@store/hook";
import { useRouter } from "next/navigation";
import { processingIndex } from "@/apis";

export const UploadSuccessController = ({ View }: { View: React.FC }) => {
  const { uuid, machine } = useAppSelector((store) => ({
    uuid: store.uuid.value,
    machine: store.machines.selectedMachine?.machine_id,
  }));
  const router = useRouter();

  useEffect(() => {
    if (uuid === null) {
      window.alert(
        "UUID is null! Something went wrong with the upload. Please try again.",
      );
      return;
    }

    const interval = setInterval(() => {
      processingIndex(uuid).then((response) => {
        if (response.data.ready) {
          router.replace(`/validate?index=${uuid}&machine=${machine}}`);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [uuid, machine, router]);

  return <View />;
};
