import { render, fireEvent, waitFor } from "@testing-library/react";
import { ValidateController } from "./page.viewcontroller";
import { confirmValidation } from "@/apis";
import { useSearchParams, useRouter } from "next/navigation";
import { Provider } from "react-redux";
import configureMockStore from "redux-mock-store";

jest.mock("../../apis", () => {
  return {
    confirmValidation: jest
      .fn()
      .mockResolvedValue(
        Promise.resolve({
          status: 200,
          data: { message: "Validation Successful" },
        }),
      ),
    fetchIndexContent: jest
      .fn()
      .mockResolvedValue(
        Promise.resolve({ status: 200, data: { index: "1" } }),
      ),
  };
});
jest.mock("next/navigation", () => {
  return {
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
    usePathname: jest.fn(),
  };
});

const mockConfirmValidation = confirmValidation as jest.MockedFunction<any>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<any>;
const mockUseRouter = useRouter as jest.MockedFunction<any>;

const mockStore = configureMockStore([]);
const store = mockStore({
  machines: {
    machines: [],
    selectedMachine: null,
  },
});

describe("ValidateController", () => {
  it("Should extract the correct parameters from the URL", () => {
    const params = new URLSearchParams();
    params.set("index", "1");
    params.set("machine", "machine-1");
    mockUseSearchParams.mockReturnValue(params);
    const TestView = () => <div>Test View</div>;
    render(
      <Provider store={store}>
        <ValidateController View={TestView} />
      </Provider>,
    );
    expect(mockUseSearchParams).toHaveBeenCalled();
  });

  it("Should call router if parameters do not exist", () => {
    const params = new URLSearchParams();
    const mockRouter = { replace: jest.fn() };
    mockUseRouter.mockReturnValue(mockRouter);
    mockUseSearchParams.mockReturnValue(params);
    const TestView = () => <div>Test View</div>;
    render(
      <Provider store={store}>
        <ValidateController View={TestView} />
      </Provider>,
    );
    expect(mockRouter.replace).toHaveBeenCalledWith("/?");
  });

  it("Should invoke confirmValidation when parameters are correct and onValidateClick is invoked", () => {
    const params = new URLSearchParams();
    params.set("index", "1");
    params.set("machine", "machine-2");
    const mockRouter = { replace: jest.fn() };
    mockUseRouter.mockReturnValue(mockRouter);
    mockUseSearchParams.mockReturnValue(params);
    const TestView = ({ onValidateClick }: any) => (
      <button onClick={onValidateClick}>Validate</button>
    );
    const { getByText } = render(
      <Provider store={store}>
        <ValidateController View={TestView} />
      </Provider>,
    );
    fireEvent.click(getByText("Validate"));
    waitFor(() => expect(mockConfirmValidation).toHaveBeenCalled());
  });
});
