/*
  Wrapper around toast with refresh. Does not require testing because
  it is technically a trivial view.
*/

import React from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const showToastWithRefresh = (errorMessage: string) => {
  const refreshPage = () => {
    window.location.reload();
  };

  const ToastContent = ({ closeToast }: { closeToast: any }) => (
    <div className="flex flex-col justify-center items-center">
      <div className="mb-2.5 text-base">{errorMessage}</div>
      <button
        onClick={() => {
          closeToast();
          refreshPage();
        }}
        className="bg-gray-500 text-white border-none rounded-md px-2 py-1 text-base"
      >
        Refresh
      </button>
    </div>
  );

  toast.error(<ToastContent closeToast={toast.dismiss} />, {
    position: "top-right",
    autoClose: 10000,
    hideProgressBar: false,
    closeOnClick: true,
    draggable: true,
    progress: undefined,
    theme: "dark",
  });
};
