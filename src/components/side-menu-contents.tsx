import { useWorkOrder, WorkOrder } from "@/contexts/WorkOrderContext";
import { ButtonWithModalConfirmation } from "./button-with-modal-confirmation";
import tickIcon from "../../assets/tick.svg";
import outboxIcon from "../../assets/outbox.svg";
import { useCallback } from "react";
import { Skeleton } from "@nextui-org/react";

export interface SideMenuProps {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
  workOrders: WorkOrder[];
  current: WorkOrder | null;
  setCurrent: (state: WorkOrder) => void;
}

export type SideMenuViewProps = SideMenuProps & {
  isProviderBusy: boolean;
  onCompleteClick: (workorder_id: string) => void;
  onUncompleteClick: (workorder_id: string) => void;
  setCardClick: (workOrder: WorkOrder) => void;
};

export interface WorkOrderComponentProps {
  workOrder: WorkOrder;
  current: WorkOrder | null;
  onlyCompleted: boolean;
  onCompleteClick: (workorder_id: string) => void;
  onUncompleteClick: (workorder_id: string) => void;
  setCardClick: (workOrder: WorkOrder) => void;
}

const renderStyles = (isCurrent: boolean) => {
  const commonStyles =
    " relative p-2 my-5 hover:bg-white/10 rounded-xl transition-all duration-300 flex justify-center";
  return (
    (isCurrent ? "bg-gray-900 text-white rounded-xl" : "text-white") +
    commonStyles
  );
};

/* Views */
export const WorkOrderComponent = ({
  workOrder,
  current,
  onlyCompleted,
  onCompleteClick,
  onUncompleteClick,
  setCardClick,
}: WorkOrderComponentProps) => {
  return (
    <a
      key={workOrder.order_id}
      href="#"
      onClick={() => setCardClick(workOrder)}
      className={renderStyles(current == workOrder)}
    >
      <div className="flex flex-col w-full">
        {current == workOrder ? (
          <>
            <div className="w-[90%]">
              <p className="pb-3">
                <span className="font-bold">Work Order:</span>{" "}
                {workOrder.task_name}
                <br />
                {workOrder.task_desc}
              </p>
              <span className="font-bold">Machine:</span>{" "}
              {workOrder.machine_name}
            </div>
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
            {workOrder.machine_name} ({workOrder.task_name})
          </>
        )}
      </div>
    </a>
  );
};

export const SideMenuContentsView = ({
  workOrders,
  current,
  isProviderBusy,
  onCompleteClick,
  onUncompleteClick,
  setCardClick,
}: SideMenuViewProps) => {
  const renderWorkOrderList = (onlyCompleted: boolean) => {
    const result = workOrders
      .filter(
        (workOrder) =>
          workOrder.resolved ===
          (onlyCompleted ? "COMPLETED" : "NOT_COMPLETED"),
      )
      .map((workOrder) => (
        <WorkOrderComponent
          key={workOrder.order_id}
          workOrder={workOrder}
          current={current}
          onlyCompleted={onlyCompleted}
          onCompleteClick={onCompleteClick}
          onUncompleteClick={onUncompleteClick}
          setCardClick={setCardClick}
        />
      ));

    if (result.length === 0) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-white">No work orders found.</p>
        </div>
      );
    }
    return result;
  };

  return (
    <>
      <div className="flex-1">
        <h2 className="text-white font-bold text-xl pb-3">Work Orders</h2>
        {isProviderBusy ? (
          <Skeleton className="w-full h-52" />
        ) : (
          renderWorkOrderList(false)
        )}
      </div>
      <div className="flex-1">
        <h2 className="text-white font-bold text-xl pb-3">Archived</h2>
        {isProviderBusy ? (
          <Skeleton className="w-full h-52" />
        ) : (
          renderWorkOrderList(true)
        )}
      </div>
    </>
  );
};

/* Controller */
export const SideMenuContentsController = ({
  isOpen,
  setIsOpen,
  workOrders,
  current,
  setCurrent,
  Child,
}: SideMenuProps & { Child: React.FC<SideMenuViewProps> }) => {
  const { markWorkOrderAsDone, markWorkOrderAsNotDone, isProviderBusy } =
    useWorkOrder();

  const setCardClick = useCallback(
    (workOrder: WorkOrder) => {
      setCurrent(workOrder);
    },
    [setCurrent],
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
    [markWorkOrderAsNotDone],
  );

  return (
    <Child
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      workOrders={workOrders}
      current={current}
      setCurrent={setCurrent}
      isProviderBusy={isProviderBusy}
      onCompleteClick={onCompleteClick}
      onUncompleteClick={onUncompleteClick}
      setCardClick={setCardClick}
    />
  );
};

export const SideMenuContents = ({
  isOpen,
  setIsOpen,
  workOrders,
  current,
  setCurrent,
}: SideMenuProps) => (
  <SideMenuContentsController
    isOpen={isOpen}
    setIsOpen={setIsOpen}
    workOrders={workOrders}
    current={current}
    setCurrent={setCurrent}
    Child={SideMenuContentsView}
  />
);

export default SideMenuContents;
