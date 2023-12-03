import PlaceholderText from "./PlaceholderText";

const FormSelectMachineContainer = () => {
  return (
    <div className="absolute h-[20.76%] w-[90.91%] top-[9.69%] right-[4.55%] bottom-[69.55%] left-[4.55%]">
      <div className="absolute h-full w-full top-[0%] right-[0%] bottom-[0%] left-[0%] rounded-lg bg-white shadow-[0px_4px_14px_rgba(0,_0,_0,_0.1)]" />
      <img
        className="absolute h-[10.67%] w-[4.07%] top-[45.5%] right-[7.61%] bottom-[43.83%] left-[88.32%] max-w-full overflow-hidden max-h-full opacity-[0.8]"
        alt=""
        src="/chevron.svg"
      />
      <PlaceholderText
        placeholderTextWidth="65.71%"
        placeholderTextHeight="33.33%"
        placeholderTextPosition="absolute"
        placeholderTextTop="33.33%"
        placeholderTextRight="28.57%"
        placeholderTextBottom="33.33%"
        placeholderTextLeft="5.71%"
      />
    </div>
  );
};

export default FormSelectMachineContainer;
