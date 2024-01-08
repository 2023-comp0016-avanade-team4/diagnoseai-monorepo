import { useMemo } from "react";
import Property1Default from "./Property1Default";

const DropdownList = ({
  dropdownListWidth,
  dropdownListPosition,
  dropdownListTop,
  dropdownListRight,
  dropdownListLeft,
  dropdownListHeight,
  dropdownListOpacity,
}) => {
  const dropdownListStyle = useMemo(() => {
    return {
      width: dropdownListWidth,
      position: dropdownListPosition,
      top: dropdownListTop,
      right: dropdownListRight,
      left: dropdownListLeft,
      height: dropdownListHeight,
      opacity: dropdownListOpacity,
    };
  }, [
    dropdownListWidth,
    dropdownListPosition,
    dropdownListTop,
    dropdownListRight,
    dropdownListLeft,
    dropdownListHeight,
    dropdownListOpacity,
  ]);

  return (
    <div
      className="rounded-lg shadow-[0px_4px_14px_rgba(0,_0,_0,_0.1)] w-[280px] overflow-hidden flex flex-col items-center justify-center gap-[1px]"
      style={dropdownListStyle}
    >
      <Property1Default
        item="XM1B1"
        property1DefaultPosition="relative"
        property1DefaultFlexShrink="0"
      />
      <Property1Default
        item="XM1B2"
        property1DefaultPosition="relative"
        property1DefaultFlexShrink="0"
      />
      <Property1Default
        item="STL00DSD"
        property1DefaultPosition="relative"
        property1DefaultFlexShrink="0"
      />
      <Property1Default
        item="E34"
        property1DefaultPosition="relative"
        property1DefaultFlexShrink="0"
      />
    </div>
  );
};

export default DropdownList;
