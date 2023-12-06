import { useMemo } from "react";

const Property1Default = ({
  item,
  property1DefaultPosition,
  property1DefaultFlexShrink,
}) => {
  const property1DefaultStyle = useMemo(() => {
    return {
      position: property1DefaultPosition,
      flexShrink: property1DefaultFlexShrink,
    };
  }, [property1DefaultPosition, property1DefaultFlexShrink]);

  return (
    <div
      className="bg-white h-11 overflow-hidden text-left text-base text-darkslategray-200 font-montserrat self-stretch"
      style={property1DefaultStyle}
    >
      <div className="absolute top-[12px] left-[16px]">{item}</div>
    </div>
  );
};

export default Property1Default;
