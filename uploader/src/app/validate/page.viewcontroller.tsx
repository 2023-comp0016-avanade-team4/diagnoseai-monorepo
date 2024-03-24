"use client";
import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "@store/hook";
import { selectMachineById } from "@store/reducers/machinesReducer";
import { RootState } from "@store/store";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ValidateViewProps } from "./page.view";
import { confirmValidation, fetchIndexContent } from "@/apis";

export const ValidateController = ({
  View,
}: {
  View: React.FC<ValidateViewProps>;
}) => {
  const [extractedText, setExtractedText] = useState<string>("Loading");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { machines, selectedMachine } = useAppSelector((state: RootState) => ({
    machines: state.machines.machines,
    selectedMachine: state.machines.selectedMachine,
  }));
  const params = useSearchParams();
  const index = params?.get("index");
  const machine = params?.get("machine");

  const onValidateClick = async () => {
    if (!window.confirm("Submit confirmation?")) {
      return;
    }

    setIsLoading(true);

    // it should never be the case that index and selectedMachine are null
    // since that is checked earlier for redirection purposes
    const response = await confirmValidation(
      index!,
      selectedMachine?.machine_id!,
    );
    if (response.status !== 200) {
      window.alert("Error moving validation index");
      return;
    }

    router.replace("/verificationsuccess");
  };

  useEffect(() => {
    if (index === null || machine === null || index === "" || machine === "") {
      router.replace("/?");
      return;
    }

    const action = selectMachineById(machines, machine as string);
    if (!action) {
      console.error("Action cannot be taken, skipping.");
      return;
    }
    dispatch(action);
  }, [router, index, machine, machines, dispatch]);

  useEffect(() => {
    // NOTE: safeguard against Machinelist loading
    if (!selectedMachine) {
      return;
    }

    const current = new URLSearchParams(Array.from(params?.entries()!));
    current.set("machine", selectedMachine?.machine_id || "");
    router.push(`${pathname}?${current.toString()}`);
  }, [selectedMachine, params, pathname, router]);

  useEffect(() => {
    const searchIndex = params?.get("index") || "";
    fetchIndexContent(searchIndex).then((response) => {
      if (response.status !== 200) {
        console.error("Error fetching index content");
        router.replace("/");
        return;
      }
      response.data.results = response.data.results || [];
      setExtractedText(response.data.results.join("\n"));
      setIsLoading(false);
    });
  }, [params, router]);

  return (
    <View
      extractedText={extractedText}
      isLoading={isLoading}
      onValidateClick={onValidateClick}
    />
  );
};
