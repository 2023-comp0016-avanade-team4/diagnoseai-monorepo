import Image from 'next/image';
import uploadsvg from '../../../public/upload.svg'
import checkcirclesvg from '../../../public/check-circle.svg'

const Sidebar = () => {
  return (
    <div className="flex-shrink-0 bg-slate-100 text-black w-1/4 p-4">
      <div className="mb-4">
        <h2 className="text-2xl text-center font-bold">Stages</h2>
      </div>
      <ul>

        <li className="mb-2">
          <div className="bg-white flex flex-row items-center justify-start gap-2 text-darkslategray-300 p-5">
            <Image className="w-5 h-5" alt="Upload Icon" src={uploadsvg} />
            <div className="inline-block shrink-0">
              Upload File
            </div>
          </div>
        </li>

        <li className="mb-2">
          <div className="bg-white flex flex-row items-center justify-start gap-2 text-darkslategray-300 p-5">
            <Image className="w-5 h-5" alt="Validate" src={checkcirclesvg} />
            <div className="inline-block shrink-0">
              Validate
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
