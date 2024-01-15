"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileUploader } from "react-drag-drop-files";
import { Skeleton, Button } from "@nextui-org/react";
import { useDispatch } from 'react-redux';
import { setUUID } from '../../redux/uuidReducer'; // Adjust the import path as needed


const fileTypes = ["PDF", "DOCX"];

export const Uploader = () => {
  const [file, setFile] = useState<File | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const handleChange = (file: File) => {
    setFile(file);
  }

  const dispatch = useDispatch();

  const uploadBtnClicked = async () => {
    setIsUploading((_) => true);
    if (file === undefined) {
      // TODO: Eventually, we should have a toast within the website
      // to show errors instead of using the alert box
      alert('please choose a file')
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/fileUpload', {
      method: 'POST',
      body: formData
    })

    const data = await response.json();
    if (data.error) {
      alert('cannot upload file');
      setIsUploading((_) => false);
    } else {
      dispatch(setUUID(data.uuid));
      router.push('/uploadsuccess');
    }
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
    <Skeleton className="w-full h-full rounded-md box-border border-solid border-whitesmoke-300 file-uploader mr-5 flex-1" isLoaded={isLoaded && !isUploading}>
      <FileUploader
        handleChange={handleChange}
        name="file"
        types={fileTypes}
        disabled={isUploading}
        required={true} />
      <Button className="my-10 max-w-xs flex-0" color="primary" disabled={!file || isUploading} onClick={uploadBtnClicked}>
        Confirm Upload
      </Button>

    </Skeleton>
  )
}

export default Uploader;
