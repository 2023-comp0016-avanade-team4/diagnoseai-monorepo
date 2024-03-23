"use client";

// This is a view-only component.

import React, { useState } from "react";
import Image from "next/image";
import Modal from "react-modal";

if (process.env.JEST_WORKER_ID === undefined) {
  // This can't really be fixed with Jest, so it needs to be here for
  // a stopgap
  Modal.setAppElement("#app");
}

const modalStyles = {
  overlay: {
    zIndex: 1100,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
};

interface ButtonWithModalConfirmationProps {
  disabled?: boolean;
  className?: string;
  svgPath: string,
  modalPrompt: string,
  alt: string;
  onClick: () => void;
}

export const ButtonWithModalConfirmation = ({
  disabled = false,
  className = "",
  svgPath = "",
  modalPrompt = "",
  alt = "",
  onClick,
}: ButtonWithModalConfirmationProps) => {
  const [modalIsOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleSubmit = () => {
    onClick();
    closeModal();
  };

  return (
    <>
      <Modal
        style={modalStyles}
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className="p-6 flex items-center justify-center fixed left-0 bottom-0 w-full h-full bg-gray-800 bg-opacity-50"
      >
        <div className="bg-gray-900 rounded shadow-lg p-4 md:p-8 m-4 w-full md:w-3/4 lg:w-1/2">
          <h1 className="text-xl text-white">
            {modalPrompt}
          </h1>
          <div className="mt-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 mr-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>

      <button
        className={`absolute top-0 right-2 bg-transparent ${className}`}
        disabled={disabled}
        onClick={openModal}
        title={alt}
      >
        <div className="transition-all fill-white duration-200 svg-not-selected hover:invert">
          <Image src={svgPath} alt={alt} width={20} height={20} />
        </div>
      </button>
    </>
  );
};
