import { useMemo } from "react";

const PlaceholderText = ({
  placeholderTextWidth,
  placeholderTextHeight,
  placeholderTextPosition,
  placeholderTextTop,
  placeholderTextRight,
  placeholderTextBottom,
  placeholderTextLeft,
}) => {
  const placeholderTextStyle = useMemo(() => {
    return {
      width: placeholderTextWidth,
      height: placeholderTextHeight,
      position: placeholderTextPosition,
      top: placeholderTextTop,
      right: placeholderTextRight,
      bottom: placeholderTextBottom,
      left: placeholderTextLeft,
    };
  }, [
    placeholderTextWidth,
    placeholderTextHeight,
    placeholderTextPosition,
    placeholderTextTop,
    placeholderTextRight,
    placeholderTextBottom,
    placeholderTextLeft,
  ]);

  return (
    <div
      className="w-[184px] h-5 text-left text-base text-dimgray font-montserrat"
      style={placeholderTextStyle}
    >
      <div className="absolute top-[0%] left-[0%]">Select Machine</div>
    </div>
  );
};

export default PlaceholderText;
