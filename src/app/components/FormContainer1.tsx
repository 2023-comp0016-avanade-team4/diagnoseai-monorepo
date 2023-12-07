const FormContainer1 = () => {
  return (
    <div className="flex-1 box-border h-[232px] flex flex-col items-center justify-end border-[1px] border-solid border-white">
      <img
        className="relative w-[15px] h-[15px] overflow-hidden shrink-0"
        alt=""
        src="/caretup.svg"
      />
      <div className="self-stretch flex-1 flex flex-col items-start justify-center">
        <div className="flex-1 relative bg-steelblue w-[15px]" />
        <div className="flex-1 relative bg-colors-grey w-[15px]" />
      </div>
      <img
        className="relative w-[15px] h-[15px] overflow-hidden shrink-0"
        alt=""
        src="/caretup1.svg"
      />
    </div>
  );
};

export default FormContainer1;
