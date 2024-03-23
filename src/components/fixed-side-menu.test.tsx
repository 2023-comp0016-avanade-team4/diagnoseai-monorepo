import React from "react";
import { render } from "@testing-library/react";
import { FixedSideMenu } from "./fixed-side-menu";

jest.mock("@/contexts/WorkOrderContext", () => ({
  useWorkOrder: () => ({
    current: {},
    setCurrent: jest.fn(),
    workOrders: [],
  }),
}));

describe("FixedSideMenu", () => {
  it("should not render when isOpen is false", () => {
    const isOpen = false;
    const setIsOpen = jest.fn();

    const { container } = render(
      <FixedSideMenu
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        className="testClass"
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
