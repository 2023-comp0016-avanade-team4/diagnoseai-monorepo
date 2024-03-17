'use client'
import { useState } from 'react';

import FileUploader from "./FileUploader";
import MachineList from "./MachinesList";

import "./uploader.css";

export const Uploader = () => {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <div className="self-stretch bg-gray-100 w-full h-full flex flex-col items-center text-left text-11xl text-black font-crete-roundoverflow-hidden shrink-0 p-5">
      <div className="text-5xl flex-0 mb-5">
        Upload Documentation
      </div>
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex-0 w-1/2">
          {isLoading ? null : <div className="pb-5">
            <label className="text-xl">Select a machine:</label>
            <MachineList />
          </div>
          }
          <label className="text-xl">Upload a file:</label>
          <FileUploader onUploadClick={() => setIsLoading(true)} onUploadCancel={() => setIsLoading(false)} />
        </div>
      </div >
    </div>
  );
}

export default Uploader;
