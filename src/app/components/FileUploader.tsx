"use client"

import React, { useState, useEffect } from 'react';
import { FileUploader } from "react-drag-drop-files";
import { Skeleton } from "@nextui-org/react";

const fileTypes = ["PDF", "DOCX"];

export const Uploader = () => {
  const [file, setFile] = useState(null);
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
  }, [])
  return (
    <Skeleton className="file-uploader-skeleton flex-auto" isLoaded={isLoaded}>
      <FileUploader
        handleChange={handleChange}
        name="file"
        types={fileTypes} />
    </Skeleton>
  )
}

export default Uploader;
