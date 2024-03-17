import React from "react";
import axios from "axios";
import { render, waitFor, screen } from "@testing-library/react";
import { WorkOrderProvider, useWorkOrder, WorkOrder } from "./WorkOrderContext";

let errorSpy: jest.SpyInstance;

describe("WorkOrderContext", () => {
  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    errorSpy.mockRestore();
  });

  it("fetches work orders and sets the first one as the current one", async () => {
    const DummyComponentFetchOrders = () => {
      const { current, workOrders, refreshOrders } = useWorkOrder();
      React.useEffect(() => {
        refreshOrders();
      }, [refreshOrders]);
      return workOrders.length > 0 ? <p>{current?.order_id}</p> : null;
    };

    const mockWorkOrders: WorkOrder[] = [
      {
        order_id: "mocked-order-id-1",
        machine_id: "mocked-machine-id",
        machine_name: "mocked-machine-name",
        conversation_id: "mocked-conversation-id",
        task_name: "mocked-task-name",
        task_desc: "mocked-task-desc",
        resolved: "COMPLETED"
      },
      {
        order_id: "mocked-order-id-2",
        machine_id: "mocked-machine-id-2",
        machine_name: "mocked-machine-name-2",
        conversation_id: "mocked-conversation-id-2",
        task_name: "mocked-task-name-2",
        task_desc: "mocked-task-desc-2",
        resolved: "NOT_COMPLETED",
      },
    ];

    axios.get = jest.fn().mockResolvedValue({ data: mockWorkOrders });

    render(
      <WorkOrderProvider>
        <DummyComponentFetchOrders />
      </WorkOrderProvider>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/workOrders");
      expect(screen.getByText(mockWorkOrders[0].order_id)).toBeInTheDocument();
    });
  });

  it("fails to fetch work order and throws an error", async () => {
    const DummyComponentFetchOrders = () => {
      const { workOrders, refreshOrders } = useWorkOrder();
      React.useEffect(() => {
        refreshOrders();
      }, [refreshOrders]);
      return workOrders.length > 0 ? <p>Something</p> : <p>Nothing</p>;
    };

    axios.get = jest
      .fn()
      .mockRejectedValue(new Error("Failed to fetch work orders"));

    render(
      <WorkOrderProvider>
        <DummyComponentFetchOrders />
      </WorkOrderProvider>,
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/workOrders");
      expect(errorSpy.mock.calls[0][0]).toMatch("Error fetching WorkOrder:");
      expect(screen.queryByText("Nothing")).toBeInTheDocument();
    });
  });

  it("marks a work order as done", async () => {
    const DummyComponentMarkAsDone = () => {
      const { current, markWorkOrderAsDone } = useWorkOrder();
      React.useEffect(() => {
        if (current) {
          markWorkOrderAsDone(current.order_id);
        }
      }, [current, markWorkOrderAsDone]);
      return <p>done</p>;
    };

    const mockWorkOrders: WorkOrder[] = [
      {
        order_id: "mocked-order-id-1",
        machine_id: "mocked-machine-id",
        machine_name: "mocked-machine-name",
        conversation_id: "mocked-conversation-id",
        task_name: "mocked-task-name",
        task_desc: "mocked-task-desc",
        resolved: "NOT_COMPLETED",
      },
    ];

    axios.get = jest.fn().mockResolvedValue({ data: mockWorkOrders });
    axios.post = jest.fn().mockResolvedValue({ data: "done" });

    render(
      <WorkOrderProvider>
        <DummyComponentMarkAsDone />
      </WorkOrderProvider>,
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/chatDone?conversationId=mocked-conversation-id&done=true",
      );
      expect(screen.getByText("done")).toBeInTheDocument();
    });
  })

  it("marks a work order as undone", async () => {
    const DummyComponentMarkAsUndone = () => {
      const { current, markWorkOrderAsNotDone } = useWorkOrder();
      React.useEffect(() => {
        if (current) {
          markWorkOrderAsNotDone(current.order_id);
        }
      }, [current, markWorkOrderAsNotDone]);
      return <p>done</p>;
    };

    const mockWorkOrders: WorkOrder[] = [
      {
        order_id: "mocked-order-id-1",
        machine_id: "mocked-machine-id",
        machine_name: "mocked-machine-name",
        conversation_id: "mocked-conversation-id",
        task_name: "mocked-task-name",
        task_desc: "mocked-task-desc",
        resolved: "COMPLETED",
      },
    ];

    axios.get = jest.fn().mockResolvedValue({ data: mockWorkOrders });
    axios.post = jest.fn().mockResolvedValue({ data: "done" });

    render(
      <WorkOrderProvider>
        <DummyComponentMarkAsUndone />
      </WorkOrderProvider>,
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/chatDone?conversationId=mocked-conversation-id&done=false",
      );
      expect(screen.getByText("done")).toBeInTheDocument();
    });
  });
});
