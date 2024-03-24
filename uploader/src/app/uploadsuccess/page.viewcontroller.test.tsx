import { render, act, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import configureMockStore from "redux-mock-store";

import { UploadSuccessController } from "./page.viewcontroller";
import { processingIndex } from "@/apis";

jest.mock("../../apis", () => {
  return {
    processingIndex: jest.fn(),
  };
});

const processingIndexMock = processingIndex as jest.Mock;

const mockState = {
  uuid: { value: "mockUuid" },
  machines: { selectedMachine: { machine_id: "mockMachine" } },
};

describe("UploadSuccessController", () => {
  it("processes the index correctly when UUID is present", async () => {
    const mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
    };

    processingIndexMock.mockResolvedValue({ data: { ready: true } });

    const View = () => <div>View component</div>;
    const store = configureMockStore([])(mockState);

    render(
      <Provider store={store}>
        <UploadSuccessController View={View} />
      </Provider>,
    );

    waitFor(
      () => {
        expect(mockRouter.replace).toHaveBeenCalledWith(
          "/validate?index=mockUuid&machine=mockMachine",
        );
        expect(processingIndex).toHaveBeenCalled();
      },
      { timeout: 10000 },
    );
  });
});
