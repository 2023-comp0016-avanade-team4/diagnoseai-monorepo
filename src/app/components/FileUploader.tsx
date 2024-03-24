"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileUploader } from "react-drag-drop-files";
import { Skeleton, Button } from "@nextui-org/react";
import { useAppDispatch, useAppSelector } from "../../redux/hook";
import { setUUID } from "../../redux/reducers/uuidReducer";
import { RootState } from "../../redux/store";

const fileTypes = ["PDF"];

interface UploaderInterface {
  onUploadClick?: () => void;
  onUploadCancel?: () => void;
}

export interface UploaderViewProps {
  file: File | undefined;
  setFile: ((file: File) => void) | undefined;
  isLoaded: boolean;
  isUploading: boolean;
  uploadBtnClicked: (() => void) | undefined;
}

export const UploaderController = ({
  View,
  onUploadCancel,
  onUploadClick,
}: { View: React.FC<UploaderViewProps> } & UploaderInterface) => {
  const [file, setFile] = useState<File | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const selectedMachine = useAppSelector(
    (store: RootState) => store.machines.selectedMachine,
  );

  useEffect(() => {
    setIsLoaded((_) => true);
  }, []);

  const uploadButtonClicked = async () => {
    setIsUploading((_) => true);
    if (file === undefined) {
      alert("please choose a file");
      onUploadCancel?.();
      return;
    }

    onUploadClick?.();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("machineId", selectedMachine?.machine_id || "");
    const response = await fetch("/api/fileUpload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (data.error) {
      alert("cannot upload file");
      setIsUploading((_) => false);
      onUploadCancel?.();
    } else {
      dispatch(setUUID(data.uuid));
      router.push("/uploadsuccess");
    }
  };

  return (
    <View
      file={file}
      setFile={setFile}
      isLoaded={isLoaded}
      isUploading={isUploading}
      uploadBtnClicked={uploadButtonClicked}
    />
  );
};

export const UploaderView = ({
  file,
  setFile,
  isLoaded,
  isUploading,
  uploadBtnClicked,
}: UploaderViewProps) => {
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
  });

  return (
    <Skeleton
      className="w-full h-full rounded-md box-border border-solid border-whitesmoke-300 file-uploader mr-5 flex-1"
      isLoaded={isLoaded && !isUploading}
    >
      <FileUploader
        handleChange={setFile}
        name="file"
        types={fileTypes}
        disabled={isUploading}
        required={true}
      />
      <Button
        className="my-10 max-w-xs flex-0"
        color="primary"
        disabled={!file || isUploading}
        onClick={uploadBtnClicked}
      >
        Confirm Upload
      </Button>
    </Skeleton>
  );
};

export const Uploader = () => {
  return <UploaderController View={UploaderView} />;
};

export default Uploader;
