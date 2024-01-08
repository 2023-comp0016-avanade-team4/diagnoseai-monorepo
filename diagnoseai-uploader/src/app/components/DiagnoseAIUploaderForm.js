import FormContainer from "./FormContainer";
import FormContainer1 from "./FormContainer1";

const DiagnoseAIUploaderForm = () => {
  return (
    <div className="relative w-[985px] h-[872.2px] overflow-hidden shrink-0 text-left text-base text-black font-crete-round">
      <div className="absolute top-[0px] left-[0px] w-52 h-[846px] overflow-hidden flex flex-col items-center justify-end">
        <div className="relative bg-white box-border w-52 h-[772px] border-[1px] border-solid border-whitesmoke-200" />
      </div>
      <FormContainer imageId="/check-circle.svg" actionButtonText="Validate" />
      <FormContainer
        imageId="/upload.svg"
        actionButtonText="Upload"
        propHeight="262.5px"
      />
      <div className="absolute top-[0px] left-[27px] w-[300px] h-[51px] overflow-hidden flex flex-col items-center justify-end text-11xl">
        <div className="relative inline-block w-[300px] h-[37px] shrink-0">
          DiagnoseAI Uploader
        </div>
      </div>
      <div className="absolute top-[0px] left-[231px] w-[754px] h-[674px] overflow-hidden flex flex-col items-center justify-end text-5xl">
        <div className="relative w-[754px] h-[507px]">
          <div className="absolute top-[0px] left-[0px] rounded-md bg-white box-border w-[775px] h-[608px] border-[1px] border-solid border-whitesmoke-300" />
          <div className="absolute top-[28px] left-[0px] w-[221px] overflow-hidden flex flex-col items-end justify-center">
            <i className="relative inline-block w-[202px] h-[37px] shrink-0">
              Extracted images
            </i>
          </div>
          <div className="absolute top-[267px] left-[0px] w-[221px] overflow-hidden flex flex-col items-center justify-center">
            <i className="relative inline-block w-[202px] h-[37px] shrink-0 text-center">
              Extracted text
            </i>
          </div>
          <img
            className="absolute top-[92px] left-[0px] w-[152px] h-[133px] overflow-hidden"
            alt=""
            src="/frame.svg"
          />
          <img
            className="absolute top-[92px] left-[0px] w-[397px] h-[133px] overflow-hidden"
            alt=""
            src="/frame1.svg"
          />
          <div className="absolute top-[315px] left-[0px] w-[fit-content] overflow-hidden flex flex-col items-end justify-center text-base font-inter">
            <div className="rounded-8xs box-border flex flex-row items-end justify-end p-5 gap-[20px] border-[1px] border-solid border-black">
              <div className="flex-1 relative">
                Doloribus eius qui repudiandae adipisci dolor. Dolorem harum
                ducimus eos est voluptatem eos hic. Sit velit quaerat voluptatum
                quae. Facilis consequatur in consequatur sequi. Quia aliquid ut
                voluptas similique quos voluptas.…
              </div>
              {/* <FormContainer1 /> */}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-[0px] left-[514px] w-[192.4px] h-[872.2px] overflow-hidden flex flex-col items-center justify-end py-[0.000030517578125px] px-0 box-border text-3xl">
        <div className="rounded-sm bg-steelblue shadow-[0px_4px_4px_rgba(0,_0,_0,_0.25)] w-[192.4px] h-[52.2px] flex flex-col items-center justify-center">
          <div className="relative inline-block w-[62px] h-[30px] shrink-0">
            Verify
          </div>
        </div>
      </div>
      <div className="absolute top-[0px] left-[562px] w-[97px] h-[130px] overflow-hidden flex flex-col items-center justify-end text-7xl">
        <div className="relative inline-block w-[97px] h-[27px] shrink-0">
          Validate
        </div>
      </div>
    </div>
  );
};

export default DiagnoseAIUploaderForm;
