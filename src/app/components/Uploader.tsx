import React, { useState } from 'react';
import FileUploader from "./FileUploader";
import { Button } from '@nextui-org/react';

import './uploader.css';

export const Uploader = () => {
  return (
    <div className="self-stretch bg-gray-100 w-full min-h-full flex flex-col items-start justify-start text-left text-11xl text-black font-crete-roundoverflow-hidden shrink-0 p-5">
      <div className="text-5xl flex-0 mb-5">
        Upload Files
      </div>
      <div className="w-full h-full rounded-md box-border border-solid border-whitesmoke-300 file-uploader mr-5 flex-1 flex flex-col items-center">
        <FileUploader />
        <Button className="my-10 max-w-xs flex-0" color="primary">
          Confirm Upload
        </Button>
      </div>
    </div >
  );
}

export default Uploader;
