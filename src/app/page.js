"use client"
import Property1Default1 from "./components/Property1Default1";
import FormContainer from "./components/FormContainer";


export default function Home() {
    async function onSubmit(event) {
        console.log("onSubmit");
        console.log(event);
        event.preventDefault();
        const data = new FormData(event.target);
        const res = await fetch("/api/fileUpload", {
            method: "POST",
            body: data,
        });
        console.log(res);
        const json = res.json().then((data) => {return data}).catch((err) => console.log(err));
    }
  return (
   <div className="relative bg-gray-100 w-full flex flex-col items-start justify-start gap-[7px] text-left text-11xl text-black font-crete-round">
      <div className="self-stretch bg-steelblue shadow-[0px_4px_4px_rgba(0,_0,_0,_0.25)] h-[66.6px] overflow-hidden shrink-0 flex flex-col items-start justify-start py-3.5 px-[37px] box-border">
        <div className="relative inline-block w-[300px] h-[37px] shrink-0">
          DiagnoseAI Uploader
        </div>
      </div>
      <div className="self-stretch relative h-[772px] overflow-hidden shrink-0 text-base">
        <div className="absolute top-[682px] left-[767px] rounded-sm bg-steelblue shadow-[0px_4px_4px_rgba(0,_0,_0,_0.25)] w-[192.4px] h-[52.2px] flex flex-col items-end justify-center py-0 px-[56.38249206542969px] box-border text-3xl">
          <div className="relative inline-block w-[75px] h-[30px] shrink-0">
            Submit
          </div>
        </div>
        <div className="absolute top-[93px] left-[225px] rounded-md bg-white box-border w-[830px] h-[432px] border-[1px] border-solid border-whitesmoke-300" />
        <div className="absolute top-[40px] left-[231px] text-5xl inline-block w-[145px] h-[27px]">
          Upload Files
        </div>
        <div className="absolute top-[190px] left-[416px] w-[448.6px] flex flex-col items-center justify-start gap-[17px] text-center text-darkslategray-100 font-roboto">
          <div className="w-[168.5px] h-[170.4px] overflow-hidden shrink-0 flex flex-col items-center justify-center">
            <img
              className="relative w-[115px] h-[115px] object-cover"
              alt=""
              src="/documenticon36560-1@2x.png"
            />
          </div>
          <div className="self-stretch relative">
            <p className="m-0">
              Drag and drop or choose file to upload your files.
            </p>
            <p className="m-0">All pdf, docx, csv, xlsx types are supported</p>
            <form onSubmit={onSubmit}>
                <input type="file" name="file" />
                <button type="submit">Submit</button>
            </form>
          </div>
        </div>
        {/* <div className="absolute top-[0px] left-[0px] bg-white box-border w-52 h-[772px] border-[1px] border-solid border-whitesmoke-200" />
        <div className="absolute h-[7.62%] w-[14.02%] top-[24.18%] right-[85.57%] bottom-[68.2%] left-[0.41%] bg-white box-border flex flex-row items-center justify-start py-[19px] px-[21.12353515625px] gap-[20px] text-darkslategray-300 border-[1px] border-solid border-whitesmoke-100">
          <img className="relative w-5 h-5" alt="" src="/check-circle.svg" />
          <div className="relative inline-block w-[99.9px] h-[23.5px] shrink-0">
            Validate
          </div>
        </div>
        <div className="absolute h-[7.62%] w-[14.02%] top-[16.8%] right-[85.57%] bottom-[75.58%] left-[0.41%] bg-white box-border flex flex-row items-center justify-start py-[19px] px-[21.12353515625px] gap-[20px] text-darkslategray-300 border-[1px] border-solid border-whitesmoke-100">
          <img className="relative w-5 h-5" alt="" src="/upload.svg" />
          <div className="relative inline-block w-[99.9px] h-[23.5px] shrink-0">
            Upload
          </div>
        </div> */}
        <div className="absolute top-[0px] left-[0px] w-52 h-[846px] overflow-hidden flex flex-col items-center justify-end">
          <div className="relative bg-white box-border w-52 h-[772px] border-[1px] border-solid border-whitesmoke-200" />
        </div>
        <FormContainer imageId="/check-circle.svg" actionButtonText="Validate" />
        <FormContainer
          imageId="/upload.svg"
          actionButtonText="Upload"
          propHeight="262.5px"
        />
        <Property1Default1
          property1DefaultPosition="absolute"
          property1DefaultTop="159px"
          property1DefaultLeft="1131px"
          machineFontWeight="unset"
          machineFontFamily="'Crete Round'"
        />
      </div>
    </div>
 );
}
