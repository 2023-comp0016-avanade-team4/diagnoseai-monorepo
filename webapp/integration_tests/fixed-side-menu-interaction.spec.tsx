/*
  Although this only tests FixedSideMenu, the interaction is similar
  (if not the same) with the BurgerSideMenu. BurgerSideMenu is a
  mobile-only feature that is also view-only, so it should not differ
  too much to warrant another integration test (Most of the
  interaction is found in SideMenuContents)
*/
import axios from "axios";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { FixedSideMenu } from "@/components/fixed-side-menu";
import { SideMenuContents } from "@/components/side-menu-contents";
import {
  WorkOrderProvider,
  useWorkOrder,
  WorkOrder,
} from "@/contexts/WorkOrderContext";
import MockAdapter from "axios-mock-adapter";

const mockAxios = new MockAdapter(axios);

describe("Side Menu Integration Test", () => {
  let workOrders: WorkOrder[];

  beforeEach(() => {
    mockAxios.reset();
    workOrders = [
      {
        order_id: "mocked-order-id-1",
        machine_id: "mocked-machine-id",
        machine_name: "mocked-machine-name",
        conversation_id: "mocked-conversation-id",
        resolved: "NOT_COMPLETED",
        task_name: "mocked-task-name-1",
        task_desc: "mocked-task-desc-1",
      },
      {
        order_id: "mocked-order-id-2",
        machine_id: "mocked-machine-id",
        machine_name: "mocked-machine-name",
        conversation_id: "mocked-conversation-id",
        resolved: "COMPLETED",
        task_name: "mocked-task-name-2",
        task_desc: "mocked-task-desc-2",
      },
    ];
  });

  afterEach(() => {
    mockAxios.reset();
  });

  const DummyComponent = () => {
    const workOrderContextValue = useWorkOrder();
    return (
      <SideMenuContents
        isOpen={false}
        setIsOpen={jest.fn()}
        current={workOrderContextValue.current}
        setCurrent={workOrderContextValue.setCurrent}
        workOrders={workOrderContextValue.workOrders}
      />
    );
  };

  it("renders work orders and updates current when work order is clicked", async () => {
    mockAxios.onGet("/api/workOrders").reply(200, workOrders);

    const { container, getByText } = render(
      <WorkOrderProvider>
        <FixedSideMenu isOpen={false} setIsOpen={jest.fn()} />
        <DummyComponent />
      </WorkOrderProvider>,
    );

    await waitFor(() =>
      expect(container).toHaveTextContent("mocked-task-name-1"),
    );
    await waitFor(() =>
      expect(container).toHaveTextContent("mocked-task-name-2"),
    );

    // By default, the first of the task names is selected. We choose the other
    // getByText fails on mocked-task-name-1, because it exists within the span. we exploit this
    fireEvent.click(getByText("mocked-machine-name (mocked-task-name-2)"));

    await waitFor(() => {
      expect(container.innerHTML).toContain(
        "mocked-machine-name (mocked-task-name-1)",
      ); // now this is selected
    });
  });

  it("moves mocked-task-name-1 to Archive", async () => {
    mockAxios
      .onPost("/api/chatDone?conversationId=mocked-order-id-1&done=true")
      .reply(200, {});
    mockAxios.onGet("/api/workOrders").reply(200, workOrders);

    const { container, getByText, getByAltText } = render(
      <WorkOrderProvider>
        <FixedSideMenu isOpen={false} setIsOpen={jest.fn()} />
        <DummyComponent />
      </WorkOrderProvider>,
    );

    await waitFor(() =>
      expect(container).toHaveTextContent("mocked-task-name-1"),
    );
    await waitFor(() =>
      expect(container).toHaveTextContent("mocked-task-name-2"),
    );
    fireEvent.click(getByAltText("Confirmation"));
    await waitFor(() => expect(getByText("Confirm")).toBeInTheDocument());
    fireEvent.click(getByText("Confirm"));

    // this would be under the "Work Orders" section (a little hard to test)
    await waitFor(() => {
      expect(container.innerHTML).toContain("No work orders found.");
      expect(mockAxios.history.post.length).toBe(1);
    });
  });

  it("moves mocked-task-name-2 to Work Orders", async () => {
    mockAxios
      .onPost("/api/chatDone?conversationId=mocked-order-id-2&done=false")
      .reply(200, {});
    mockAxios.onGet("/api/workOrders").reply(200, workOrders);

    const { container, getByText, getByAltText } = render(
      <WorkOrderProvider>
        <FixedSideMenu isOpen={false} setIsOpen={jest.fn()} />
        <DummyComponent />
      </WorkOrderProvider>,
    );

    await waitFor(() =>
      expect(container).toHaveTextContent("mocked-task-name-1"),
    );
    await waitFor(() =>
      expect(container).toHaveTextContent("mocked-task-name-2"),
    );
    fireEvent.click(getByText("mocked-machine-name (mocked-task-name-2)"));
    await waitFor(() => {
      expect(container.innerHTML).toContain(
        "mocked-machine-name (mocked-task-name-1)",
      );
    });

    fireEvent.click(getByAltText("Unarchive"));
    await waitFor(() => expect(getByText("Confirm")).toBeInTheDocument());
    fireEvent.click(getByText("Confirm"));

    // this would be under the "Archived" section (a little hard to test)
    await waitFor(() => {
      expect(container.innerHTML).toContain("No work orders found.");
      expect(mockAxios.history.post.length).toBe(1);
    });
  });
});
