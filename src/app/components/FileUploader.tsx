"use client"

import React, { useState } from 'react';
import { FileUploader } from "react-drag-drop-files";

const fileTypes = ["PDF", "DOCX"];

export const Uploader = () => {
  const [file, setFile] = useState(null);
  const handleChange = (file) => {
    setFile(file);
    // TODO(james): remove this debugging line
    console.log("File selected", file);
  }
  return (
    <FileUploader
      handleChange={handleChange}
      name="file"
      types={fileTypes} />
  );
}

export default FileUploader;
