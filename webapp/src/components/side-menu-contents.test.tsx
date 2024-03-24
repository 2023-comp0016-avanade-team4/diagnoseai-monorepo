/*
  Does not contain tests for SideMenuContentsView, because there's
  nmothing to test; it's pure passing-the-props-then-rendering.
*/

import { WorkOrder, useWorkOrder } from "@/contexts/WorkOrderContext";
import { render, fireEvent, waitFor } from "@testing-library/react";
import {
  WorkOrderComponent,
  SideMenuContentsController,
} from "./side-menu-contents";

jest.mock("@/contexts/WorkOrderContext", () => ({
  useWorkOrder: jest.fn().mockReturnValue({
    markWorkOrderAsDone: jest.fn(),
    markWorkOrderAsNotDone: jest.fn(),
    isProviderBusy: false,
  }),
}));

describe("WorkOrderComponent", () => {
  it("renders as selected when workOrder == current", async () => {
    // mock function props
    const mockSetCardClick = jest.fn();
    const mockOnCompleteClick = jest.fn();
    const mockOnUncompleteClick = jest.fn();

    // mock workOrder data
    const workOrder = {
      order_id: "1",
      task_name: "task",
      task_desc: "desc, i love unit tests",
      machine_name: "reeee",
      resolved: "NOT_COMPLETED",
    } as WorkOrder;

    const { container } = render(
      <WorkOrderComponent
        workOrder={workOrder}
        current={workOrder}
        onlyCompleted={false}
        onCompleteClick={mockOnCompleteClick}
        onUncompleteClick={mockOnUncompleteClick}
        setCardClick={mockSetCardClick}
      />,
    );

    await waitFor(() => {
      expect(container).toHaveTextContent("task");
      expect(container).toHaveTextContent("desc, i love unit tests");
      expect(container).toHaveTextContent("Machine: reeee");
    });
  });

  it("renders as not current when WorkOrder != current", () => {
    const mockSetCardClick = jest.fn();
    const mockOnCompleteClick = jest.fn();
    const mockOnUncompleteClick = jest.fn();

    const workOrder = {
      order_id: "1",
      task_name: "task",
      task_desc: "desc, i love unit tests",
      machine_name: "reeee",
      resolved: "NOT_COMPLETED",
    } as WorkOrder;

    const { getByText } = render(
      <WorkOrderComponent
        workOrder={workOrder}
        current={{ ...workOrder, order_id: "2" }}
        onlyCompleted={false}
        onCompleteClick={mockOnCompleteClick}
        onUncompleteClick={mockOnUncompleteClick}
        setCardClick={mockSetCardClick}
      />,
    );

    waitFor(() => {
      expect(getByText("reeee (task)")).toBeInTheDocument();
      expect(getByText("desc, i love unit tests")).not.toBeInTheDocument();
    });
  });
});

describe("SideMenuContentsController", () => {
  it("calls all the right stuff when interacted with", () => {
    const setCurrent = jest.fn();
    const Child: React.FC<any> = ({
      setCardClick,
      onUncompleteClick,
      onCompleteClick,
    }) => {
      return (
        <div>
          <div onClick={() => setCardClick({} as WorkOrder)}>Test click</div>
          <div onClick={() => onUncompleteClick("5678")}>Uncomplete</div>
          <div onClick={() => onCompleteClick("1234")}>Complete</div>
        </div>
      );
    };

    const { getByText } = render(
      <SideMenuContentsController
        isOpen={false}
        setIsOpen={jest.fn()}
        workOrders={[]}
        current={null}
        setCurrent={setCurrent}
        Child={Child}
      />,
    );

    fireEvent.click(getByText("Test click"));
    expect(setCurrent).toHaveBeenCalled();

    // NOTE: using the useWorkOrder() is ok, they are mocks
    fireEvent.click(getByText("Complete"));
    expect(useWorkOrder().markWorkOrderAsDone).toHaveBeenCalledWith("1234");

    fireEvent.click(getByText("Uncomplete"));
    expect(useWorkOrder().markWorkOrderAsNotDone).toHaveBeenCalledWith("5678");
  });
});
