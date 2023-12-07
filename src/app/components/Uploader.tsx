import React, { useState } from 'react';
import FileUploader from "./FileUploader";
import { Button } from '@nextui-org/react';

import './uploader.css';

export const Uploader = () => {
  return (
    <div className="bg-gray-100 w-full min-h-full flex flex-col items-start justify-start text-left text-11xl text-black font-crete-round">
      <div className="self-stretch relative overflow-hidden shrink-0 text-base">
        <div className="rounded-sm bg-steelblue flex flex-col items-end justify-center py-0 box-border text-3xl">
        </div>
        <div className="text-5xl inline-block">
          Upload Files
        </div>
        <div className="max-w-full rounded-md box-border border-solid border-whitesmoke-300 file-uploader mr-5 flex flex-col items-center">
          <FileUploader />
          <Button className="my-10 max-w-xs" color="primary">
            Confirm Upload
          </Button>
        </div>
      </div>
    </div >
  );
}

export default Uploader;
