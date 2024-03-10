import { slide as Menu } from "react-burger-menu";
import { useWorkOrder, WorkOrder } from "@/contexts/WorkOrderContext";
import { ButtonWithModalConfirmation } from "./button-with-modal-confirmation";
import tickIcon from '../../assets/tick.svg';
import outboxIcon from '../../assets/outbox.svg';
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
    " relative p-2 my-5 hover:bg-white/10 rounded-xl transition-all duration-300 flex justify-center";
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
  const { markWorkOrderAsDone, markWorkOrderAsNotDone } = useWorkOrder();

  const setCardClick = useCallback(
    (workOrder: WorkOrder) => {
      setCurrent(workOrder);
      setIsOpen(false);
    },
    [setCurrent, setIsOpen],
  );

  const onCompleteClick = useCallback(
    (workorder_id: string) => {
      markWorkOrderAsDone(workorder_id);
    },
    [markWorkOrderAsDone],
  );

  const onUncompleteClick = useCallback(
    (workorder_id: string) => {
      markWorkOrderAsNotDone(workorder_id);
    },
    [markWorkOrderAsDone]
  );

  const renderWorkOrderList = (onlyCompleted: boolean) => {
    return workOrders
      .filter(
        (workOrder) =>
          workOrder.resolved ===
          (onlyCompleted ? "COMPLETED" : "NOT_COMPLETED"),
      )
      .map((workOrder) => (
        <a
          key={workOrder.order_id}
          href="#"
          onClick={() => setCardClick(workOrder)}
          className={renderStyles(current == workOrder)}
        >
          <div className="flex flex-col w-full">
            {current == workOrder ? (
              <>
                <p>
                  <p className="pb-3">
                    <span className="font-bold">Work Order:</span>{" "}
                    {workOrder.order_id}
                  </p>
                  <span className="font-bold">Machine:</span>{" "}
                  {workOrder.machine_name}
                </p>
                {onlyCompleted ? (
                  <ButtonWithModalConfirmation
                    className="my-2 self-center"
                    disabled={false}
                    svgPath={outboxIcon}
                    modalPrompt="Are you sure you want to unarchive this work order?"
                    alt="Unarchive"
                    onClick={() => onUncompleteClick(workOrder.order_id)}
                  />
                ) : (
                  <ButtonWithModalConfirmation
                    className="my-2 self-center"
                    disabled={false}
                    svgPath={tickIcon}
                    modalPrompt="Are you sure you want to mark this work order as done?"
                    alt="Confirmation"
                    onClick={() => onCompleteClick(workOrder.order_id)}
                  />
                )}
              </>
            ) : (
              <>
                {workOrder.machine_name} ({workOrder.order_id})
              </>
            )}
          </div>
        </a>
      ));
  };

  return (
    <Menu
      isOpen={isOpen}
      onStateChange={(state: { isOpen: boolean }) => setIsOpen(state.isOpen)}
      styles={menuStyles}
    >
      <div>
        <h2 className="text-white font-bold text-xl pb-3">Work Orders</h2>
        {renderWorkOrderList(false)}
      </div>
      <div>
        <h2 className="text-white font-bold text-xl pb-3">Archived</h2>
        {renderWorkOrderList(true)}
      </div>
    </Menu>
  );
};

export default SideMenu;
