"use client"

import React, { useState, useEffect } from 'react';
import { FileUploader } from "react-drag-drop-files";
import { Skeleton } from "@nextui-org/react";
import { Button } from '@nextui-org/react';

const fileTypes = ["PDF", "DOCX"];

export const Uploader = () => {
  const [file, setFile] = useState<File | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const handleChange = (file) => {
    setFile(file);
    // TODO(james): remove this debugging line
    console.log("File selected", file);
  }

  useEffect(() => {
    // useEffect only runs on mount, so this hook essentially ensures
    // that FileUploder has fully loaded (it takes a while)
    setIsLoaded(_ => true);
  }, []);

  // HACK: The FileUploader component doesn't let us change the
  // success message directly, so we change it with JS
  useEffect(() => {
    const element = document.querySelector(".sc-fqkvVR");
    if (element) {
      const successSpan = element.querySelector("span");
      if (successSpan?.textContent?.includes("Successfully")) {
        successSpan.textContent = `Selected file: ${file?.name}`;
      }
    }
  })

  return (
    <Skeleton className="w-full h-full rounded-md box-border border-solid border-whitesmoke-300 file-uploader mr-5 flex-1" isLoaded={isLoaded}>
      <FileUploader
        handleChange={handleChange}
        name="file"
        types={fileTypes}
        required={true} />
      <Button className="my-10 max-w-xs flex-0" color="primary">
        Confirm Upload
      </Button>

    </Skeleton>
  )
}

export default Uploader;
