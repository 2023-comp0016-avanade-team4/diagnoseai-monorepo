import DiagnoseAIUploaderForm from "../components/DiagnoseAIUploaderForm";
import AIContainer from "../components/AIContainer";

const Validate = () => {
  return (
    <div className="relative w-full h-[952px]">
      <div className="absolute top-[0px] left-[0px] w-[1512.2px] overflow-hidden flex flex-col items-center justify-start">
        <img
          className="self-stretch relative max-w-full overflow-hidden h-[952px] shrink-0"
          alt=""
          src="/rectangle-1.svg"
        />
        <div className="self-stretch relative bg-steelblue shadow-[0px_4px_4px_rgba(0,_0,_0,_0.25)] h-[66.6px] mt-[-952px]" />
      </div>
      <div className="absolute top-[0px] left-[0px] w-[1772px] overflow-hidden flex flex-row items-start justify-between">
        <DiagnoseAIUploaderForm />
        <AIContainer />
      </div>
    </div>
  );
};

export default Validate;
