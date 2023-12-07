const AIContainer = () => {
  return (
    <div className="relative w-[729px] h-[698px] overflow-hidden shrink-0 text-left text-7xl text-black font-crete-round">
      <img
        className="absolute top-[0px] left-[0px] w-[729px] h-[103px] overflow-hidden"
        alt=""
        src="/frame2.svg"
      />
      <div className="absolute top-[0px] left-[61px] w-[357px] h-[152px] overflow-hidden flex flex-col items-center justify-end">
        <div className="relative leading-[150%] inline-block w-[357px] h-[35px] shrink-0">
          Check the AI’s understanding
        </div>
      </div>
      <div className="absolute top-[0px] left-[34px] w-[371px] h-[698px] overflow-hidden flex flex-col items-center justify-end text-xl">
        <div className="relative w-[371px] h-[494px]">
          <div className="absolute top-[503.5px] left-[1.5px] rounded-lg bg-gray-200 box-border w-[368px] h-[58px] overflow-hidden flex flex-row items-center justify-start py-[9px] px-2.5 gap-[278px] border-[1px] border-solid border-black">
            <img
              className="relative w-[25px] h-[25px]"
              alt=""
              src="/vector.svg"
            />
            <div className="rounded bg-steelblue w-[43px] h-[39px] flex flex-row items-center justify-center p-2 box-border">
              <img
                className="relative w-[26px] h-[21px]"
                alt=""
                src="/vector1.svg"
              />
            </div>
          </div>
          <div className="absolute bottom-[67px] left-[0px] w-[371px] h-[427px] flex flex-col items-center justify-start gap-[21px]">
            <div className="flex flex-col items-start justify-start">
              <div className="w-[363px] flex flex-col items-start justify-center py-0 pr-10 pl-0 box-border">
                <div className="self-stretch rounded-t-lg rounded-br-lg rounded-bl-none bg-white flex flex-row items-center justify-start p-3 border-[1px] border-solid border-black">
                  <div className="flex-1 relative leading-[150%]">
                    <p className="m-0">Verify your information here!</p>
                    <p className="m-0">
                      Send me an image or chat with me to see if the document
                      was parsed correctly!
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-[361px] flex flex-col items-end justify-center py-0 pr-0 pl-[68px] box-border">
              <div className="rounded-t-lg rounded-br-none rounded-bl-lg bg-steelblue box-border w-[73px] flex flex-row items-center justify-start p-3 border-[1px] border-solid border-black">
                <img className="relative w-11 h-11" alt="" src="/vector2.svg" />
              </div>
            </div>
            <div className="flex flex-col items-start justify-start">
              <div className="w-[363px] flex flex-col items-start justify-center py-0 pr-10 pl-0 box-border">
                <div className="self-stretch rounded-t-lg rounded-br-lg rounded-bl-none bg-white flex flex-row items-center justify-start p-3 border-[1px] border-solid border-black">
                  <div className="flex-1 relative leading-[150%]">
                    The image you uploaded appears to be a machine of model
                    XMB01. It has the following specifications...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIContainer;
