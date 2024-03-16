import { SideMenuContents } from "./side-menu-contents";
import { useWorkOrder } from "@/contexts/WorkOrderContext";
import { Button } from "@nextui-org/react"

interface FixedSideMenuProps {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
  className?: string;
}

export const SideMenuButton = ({ isOpen, setIsOpen }: FixedSideMenuProps) => {
  if (isOpen) {
    return <Button onClick={() => setIsOpen(false)} isIconOnly>&lt;&lt;</Button >
  }
  return <Button onClick={() => setIsOpen(true)} isIconOnly>&gt;&gt;</Button >
};

export const FixedSideMenu = ({ isOpen, setIsOpen, className }: FixedSideMenuProps) => {
  const { current, setCurrent, workOrders } = useWorkOrder();

  if (!isOpen) return null;

  return (
    <div className={`flex-none flex flex-col py-[2.5em] px-[1.5em] bg-[#373a47] w-72 ${className}`} >
      <SideMenuContents isOpen={isOpen} setIsOpen={setIsOpen} workOrders={workOrders} current={current} setCurrent={setCurrent} />
    </div >
  );
};
