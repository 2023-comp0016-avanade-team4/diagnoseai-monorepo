'use client'
import { useState } from 'react';

import FileUploader from "./FileUploader";
import MachineList from "./MachinesList";

import "./uploader.css";

export const Uploader = () => {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <div className="self-stretch bg-gray-100 w-full h-full flex flex-col items-start justify-start text-left text-11xl text-black font-crete-roundoverflow-hidden shrink-0 p-5">
      <div className="text-5xl flex-0 mb-5">
        Upload Files
      </div>
      {isLoading ? null : <div className="flex-0 mb-5 w-full">
        <label className="text-xl">Select Machine:</label>
        <MachineList />
      </div>
      }
      <FileUploader onUploadClick={() => setIsLoading(true)} onUploadCancel={() => setIsLoading(false)} />
    </div >
  );
}

export default Uploader;
