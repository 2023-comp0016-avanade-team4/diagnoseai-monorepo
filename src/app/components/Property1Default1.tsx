import { useMemo } from "react";
import ListBoxTitle from "./ListBoxTitle";
import PlaceholderText from "./PlaceholderText";
import DropdownList from "./DropdownList";

const Property1Default1 = ({
  property1DefaultPosition,
  property1DefaultTop,
  property1DefaultLeft,
  machineFontWeight,
  machineFontFamily,
}) => {
  const property1Default1Style = useMemo(() => {
    return {
      position: property1DefaultPosition,
      top: property1DefaultTop,
      left: property1DefaultLeft,
    };
  }, [property1DefaultPosition, property1DefaultTop, property1DefaultLeft]);

  const machineStyle = useMemo(() => {
    return {
      fontWeight: machineFontWeight,
      fontFamily: machineFontFamily,
    };
  }, [machineFontWeight, machineFontFamily]);

  return (
    <div className="w-[308px] h-[289px]" style={property1Default1Style}>
      <ListBoxTitle
        listBoxTitleWidth="90.91%"
        listBoxTitleHeight="6.92%"
        listBoxTitlePosition="absolute"
        listBoxTitleTop="0%"
        listBoxTitleRight="4.55%"
        listBoxTitleBottom="93.08%"
        listBoxTitleLeft="4.55%"
        machineFontWeight="500"
        machineFontFamily="Montserrat"
      />
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
      <div className="absolute h-[90.31%] w-full top-[9.69%] right-[0%] bottom-[0%] left-[0%] overflow-hidden">
        <DropdownList
          dropdownListWidth="90.91%"
          dropdownListPosition="absolute"
          dropdownListTop="68px"
          dropdownListRight="4.55%"
          dropdownListLeft="4.55%"
          dropdownListHeight="1px"
          dropdownListOpacity="0"
        />
      </div>
    </div>
  );
};

export default Property1Default1;
