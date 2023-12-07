import { useMemo } from "react";

const ListBoxTitle = ({
  listBoxTitleWidth,
  listBoxTitleHeight,
  listBoxTitlePosition,
  listBoxTitleTop,
  listBoxTitleRight,
  listBoxTitleBottom,
  listBoxTitleLeft,
  machineFontWeight,
  machineFontFamily,
}) => {
  const listBoxTitleStyle = useMemo(() => {
    return {
      width: listBoxTitleWidth,
      height: listBoxTitleHeight,
      position: listBoxTitlePosition,
      top: listBoxTitleTop,
      right: listBoxTitleRight,
      bottom: listBoxTitleBottom,
      left: listBoxTitleLeft,
    };
  }, [
    listBoxTitleWidth,
    listBoxTitleHeight,
    listBoxTitlePosition,
    listBoxTitleTop,
    listBoxTitleRight,
    listBoxTitleBottom,
    listBoxTitleLeft,
  ]);

  const machineStyle = useMemo(() => {
    return {
      fontWeight: machineFontWeight,
      fontFamily: machineFontFamily,
    };
  }, [machineFontWeight, machineFontFamily]);

  return (
    <div
      className="w-[95px] h-5 text-left text-base text-darkslategray-200 font-montserrat"
      style={listBoxTitleStyle}
    >
      <div
        className="absolute top-[0%] left-[0%] font-medium"
        style={machineStyle}
      >
        <p className="m-0">Machine</p>
      </div>
    </div>
  );
};

export default ListBoxTitle;
