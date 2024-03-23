import { SideMenuContents } from "./side-menu-contents";
import { useWorkOrder, WorkOrder } from "@/contexts/WorkOrderContext";
import BurgerSvg from "./BurgerSvg";
import React from "react";

/* SideMenuButton */
export const SideMenuButton = ({ isOpen, setIsOpen }: FixedSideMenuProps) => {
  return <BurgerSvg onClick={() => setIsOpen(!isOpen)} />;
};

/* FixedSideMenu */
interface FixedSideMenuProps {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
  className?: string;
}

export type FixedSideMenuViewProps = FixedSideMenuProps & {
  current: WorkOrder | null;
  setCurrent: (state: WorkOrder) => void;
  workOrders: WorkOrder[];
};

export const FixedSideMenuView = ({
  isOpen,
  setIsOpen,
  className,
  current,
  setCurrent,
  workOrders,
}: FixedSideMenuViewProps) => {
  return (
    <div
      className={`flex-none flex flex-col py-[2.5em] px-[1.5em] bg-[#373a47] w-72 ${className}`}
    >
      <SideMenuContents
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        workOrders={workOrders}
        current={current}
        setCurrent={setCurrent}
      />
    </div>
  );
};

export const FixedSideMenuController = ({
  isOpen,
  setIsOpen,
  className,
  Child,
}: FixedSideMenuProps & { Child: React.FC<FixedSideMenuViewProps> }) => {
  const { current, setCurrent, workOrders } = useWorkOrder();

  if (!isOpen) return null;

  return (
    <Child
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      className={className}
      current={current}
      setCurrent={setCurrent}
      workOrders={workOrders}
    />
  );
};

export const FixedSideMenu = ({
  isOpen,
  setIsOpen,
  className,
}: FixedSideMenuProps) => {
  return (
    <FixedSideMenuController
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      className={className}
      Child={FixedSideMenuView}
    />
  );
};
