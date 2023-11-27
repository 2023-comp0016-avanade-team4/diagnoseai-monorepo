import { useMemo } from "react";

const FormContainer = ({ imageId, actionButtonText, propHeight }) => {
  const frameStyle = useMemo(() => {
    return {
      height: propHeight,
    };
  }, [propHeight]);

  return (
    <div
      className="absolute top-[0px] left-[5.9px] w-[201.8px] h-[319.5px] overflow-hidden flex flex-col items-center justify-end py-[0.00000762939453125px] px-0 box-border text-left text-base text-darkslategray-300 font-crete-round"
      style={frameStyle}
    >
      <div className="bg-white box-border w-[201.8px] h-[58.8px] flex flex-row items-center justify-start py-[19px] px-[21.12353515625px] gap-[20px] border-[1px] border-solid border-whitesmoke-100">
        <img className="relative w-5 h-5" alt="" src={imageId} />
        <div className="relative inline-block w-[99.9px] h-[23.5px] shrink-0">
          {actionButtonText}
        </div>
      </div>
    </div>
  );
};

export default FormContainer;
