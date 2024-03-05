import { slide as Menu } from "react-burger-menu";
import { useChatProvider } from "@/contexts/ChatContext";
import { WorkOrder } from "@/contexts/WorkOrderContext";
import { CompleteButton } from "./complete-button";
import { useCallback } from "react";

const menuStyles = {
  bmBurgerButton: {
    position: "fixed",
    width: "20px",
    height: "20px",
    left: "20px",
    top: "26px",
  },
  bmCrossButton: {
    height: "24px",
    width: "24px",
  },
  bmBurgerBars: {
    background: "#373a47",
  },
  bmCross: {
    background: "#bdc3c7",
  },
  bmMenuWrap: {
    top: "0",
    left: "0",
    position: "fixed",
    height: "100%",
  },
  bmMenu: {
    top: "0",
    left: "0",
    background: "#373a47",
    padding: "2.5em 1.5em 0",
    fontSize: "1.15em",
  },
  bmOverlay: {
    top: "0",
    left: "0",
    background: "rgba(0, 0, 0, 0.3)",
  },
};

interface SideMenuProps {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
  workOrders: WorkOrder[];
  current: WorkOrder | null;
  setCurrent: (state: WorkOrder) => void;
}

const renderStyles = (isCurrent: boolean) => {
  const commonStyles =
    " p-2 my-5 hover:bg-white/10 rounded-xl transition-all duration-300 flex justify-center";
  return (
    (isCurrent ? "bg-gray-900 text-white rounded-xl" : "text-white") +
    commonStyles
  );
};

const SideMenu = ({
  isOpen,
  setIsOpen,
  workOrders,
  current,
  setCurrent,
}: SideMenuProps) => {
  const { markConversationDone } = useChatProvider();

  const onCompleteClick = useCallback((conversation_id: string) => {
    markConversationDone(conversation_id);
  }, [markConversationDone]);

  return (
    <Menu
      isOpen={isOpen}
      onStateChange={(state: { isOpen: boolean }) => setIsOpen(state.isOpen)}
      styles={menuStyles}
    >
      <h2 className="text-white font-bold text-xl pb-3">Work Orders</h2>
      {workOrders.map((workOrder) => (
        <a
          key={workOrder.order_id}
          href="#"
          onClick={() => setCurrent(workOrder)}
          className={renderStyles(current == workOrder)}
        >
          <div className="flex flex-col">
            <p className="pb-3">
              <span className="font-bold">Work Order:</span> {workOrder.order_id}
            </p>
            <p>
              <span className="font-bold">Machine:</span> {workOrder.machine_name}
            </p>
            {current == workOrder ?
              <CompleteButton
                className="my-2 self-center"
                disabled={false}
                onClick={() => onCompleteClick(workOrder.conversation_id)} />
              : null}
          </div>
        </a>
      ))}
    </Menu>
  );
};

export default SideMenu;
