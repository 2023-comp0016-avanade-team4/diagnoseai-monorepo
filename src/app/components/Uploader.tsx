import FileUploader from "./FileUploader";

import './uploader.css';

export const Uploader = () => {
  return (
    <div className="self-stretch bg-gray-100 w-full h-full flex flex-col items-start justify-start text-left text-11xl text-black font-crete-roundoverflow-hidden shrink-0 p-5">
      <div className="text-5xl flex-0 mb-5">
        Upload Files
      </div>
      <FileUploader />
    </div >
  );
}

export default Uploader;
