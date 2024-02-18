import { slide as Menu } from "react-burger-menu";
import { WorkOrder } from "@/contexts/WorkOrderContext";

const menuStyles = {
  bmBurgerButton: {
    position: 'fixed',
    width: '20px',
    height: '20px',
    left: '20px',
    top: '26px',
  },
  bmCrossButton: {
    height: '24px',
    width: '24px'
  },
  bmBurgerBars: {
    background: '#373a47'
  },
  bmCross: {
    background: '#bdc3c7'
  },
  bmMenuWrap: {
    top: '0',
    left: '0',
    position: 'fixed',
    height: '100%'
  },
  bmMenu: {
    top: '0',
    left: '0',
    background: '#373a47',
    padding: '2.5em 1.5em 0',
    fontSize: '1.15em'
  },
  bmOverlay: {
    top: '0',
    left: '0',
    background: 'rgba(0, 0, 0, 0.3)'
  }
}

interface SideMenuProps {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
  workOrders: WorkOrder[];
  current: WorkOrder | null;
  setCurrent: (state: WorkOrder) => void;
};

const SideMenu = ({ isOpen,
  setIsOpen,
  workOrders,
  current,
  setCurrent }: SideMenuProps) => {
  return (
    <Menu isOpen={isOpen}
      onStateChange={(state: { isOpen: boolean }) => setIsOpen(state.isOpen)}
      styles={menuStyles}>
      <h2 className="text-white font-bold text-xl">Work Orders</h2>
      {workOrders.map((workOrder) => (
        <a
          key={workOrder.order_id}
          href="#"
          onClick={() => setCurrent(workOrder)}
          className="block text-white hover:bg-white/10 p-3"
        >
          {current == workOrder ? <p className="font-bold underline">
            {workOrder.machine_name}</p> : workOrder.machine_name}
        </a>
      ))}
    </Menu>
  )
};

export default SideMenu;
