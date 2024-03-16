"use client";
import { Button } from "@nextui-org/react";
import { useEffect, useRef, useState } from "react";
import Chat from "../components/Chat";
import { useAppSelector, useAppDispatch } from "../../redux/hook";
import { selectMachineById } from "../../redux/reducers/selectedMachineReducer";
import { RootState } from "../../redux/store";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Skeleton } from "@nextui-org/react";
import MachineList from "../components/MachinesList";
import { WebSocketProvider } from '../contexts/WebSocketContext';

const Validate = () => {
  // TODO: whoever is doing the backend, use setExtractedText
  const [extractedText, setExtractedText] = useState<string>(
    "Loading",
  );
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { machines, selectedMachine } = useAppSelector((state: RootState) => ({
    machines: state.machines,
    selectedMachine: state.selectedMachine,
  }));
  const params = useSearchParams();
  const index = params?.get("index");
  const machine = params?.get("machine");

  const onValidateClick = async () => {
    // HACK: We do this for now. In the future, we should use a JS
    // component for confirmations
    if (!window.confirm("Submit confirmation?")) {
      return;
    }

    setIsLoading(true);

    const response = await fetch("/api/confirmValidation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        validation_index_name: index,
        production_index_name: selectedMachine?.machine_id,
      }),
    });

    if (response.status !== 200) {
      console.error("Error moving validation index");
      // return; // HACK: Redirect anyway
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
      console.error('Action cannot be taken, skipping.')
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
  }, [selectedMachine, params, pathname, router])

  useEffect(() => {
    const searchIndex = params?.get("index") || "";
    fetch(`/api/indexContent?searchIndex=${searchIndex}`, {
      method: "GET",
    }).then((response) => {
      if (response.status !== 200) {
        console.error("Error fetching index content");
        router.replace('/');
        return;
      }
      response.json().then((data) => {
        setExtractedText(data.results.join("\n"));
        setIsLoading(false);
      });
    });
  }, [params, router]);

  // NOTE: We use a separate code path to handle loading, because the
  // skeleton mistakenly affects the height & width of the chat
  // component
  if (isLoading) {
    return <Skeleton className="h-full w-full" />;
  }

  return (
    <div className="flex h-full max-h-full">
      <div className="flex-1 max-h-full">
        <div className="p-4 bg-gray-200 h-full flex">
          <div className="grid grid-cols-1 grid-rows-[auto,1fr,3fr,auto] w-full max-h-full">
            <h2 className="mb-2 text-2xl text-center font-bold">
              Validate
            </h2>
            <div className="bg-slate-100 flex flex-col">
              <h3 className="p-3 text-md font-bold flex-0">Selected Machine</h3>
              <div className="m-3 bg-slate-200 rounded p-4 overflow-y-auto">
                <MachineList />
              </div>
            </div>
            <div className="bg-slate-100 flex flex-col overflow-y-auto">
              <h3 className="p-3 text-md font-bold flex-0">Extracted text</h3>
              <div className="m-3 bg-slate-200 rounded p-4 overflow-y-auto">
                <p>{extractedText}</p>
              </div>
            </div>
            <Button
              className="my-3 max-w-xs flex-0 place-self-center"
              color="primary"
              onClick={onValidateClick}
            >
              Confirm Validation
            </Button>
          </div >
        </div >
      </div >

      <div className="flex-shrink-0 w-4/12">
        <div className="p-4 bg-gray-300 h-full flex flex-col">
          <h2 className="mb-2 text-2xl text-center font-bold">
            Chat
          </h2>
          <div className="flex-1 h-full relative" style={{ 'maxHeight': '95%' }}>
            <WebSocketProvider>
              <Chat />
            </WebSocketProvider>
          </div>
        </div>
      </div>
    </div >
  );
};

export default Validate;
