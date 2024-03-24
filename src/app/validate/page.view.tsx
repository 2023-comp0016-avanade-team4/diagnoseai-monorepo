'use client'
import { Button, Skeleton } from "@nextui-org/react";
import MachineList from "@/app/components/MachinesList";
import { WebSocketProvider } from "@/app/contexts/WebSocketContext";
import Chat from "@/app/components/Chat";

export interface ValidateViewProps {
  extractedText: string;
  isLoading: boolean;
  onValidateClick: (() => void) | undefined;
}

export const ValidateView = ({
  extractedText,
  isLoading,
  onValidateClick,
}: ValidateViewProps) => {
  if (isLoading) {
    return <Skeleton className="h-full w-full" />;
  }

  return (
    <div className="flex h-full max-h-full">
      <div className="flex-1 max-h-full">
        <div className="p-4 bg-gray-200 h-full flex">
          <div className="grid grid-cols-1 grid-rows-[auto,1fr,3fr,auto] w-full max-h-full">
            <h2 className="mb-2 text-2xl text-center font-bold">Validate</h2>
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
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 w-4/12">
        <div className="p-4 bg-slate-100 h-full flex flex-col">
          <h2 className="mb-2 text-2xl text-center font-bold">Chat</h2>
          <div className="flex-1 h-full relative" style={{ maxHeight: "95%" }}>
            <WebSocketProvider>
              <Chat />
            </WebSocketProvider>
          </div>
        </div>
      </div>
    </div>
  );
};
