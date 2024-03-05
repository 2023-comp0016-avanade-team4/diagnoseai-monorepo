'use client'

import React, { useState } from 'react';
import Modal from 'react-modal';

Modal.setAppElement("#app")

const modalStyles = {
  overlay: {
    zIndex: 1100,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
}

interface CompleteButtonProps {
  disabled?: boolean;
  className?: string;
  onClick: () => void;
}


export const CompleteButton = ({ disabled = false, className = '', onClick }: CompleteButtonProps) => {
  const [modalIsOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
  }

  const closeModal = () => {
    setIsOpen(false);
  }

  const handleSubmit = () => {
    onClick();
    closeModal();
  }

  return (
    <>
      <Modal style={modalStyles} isOpen={modalIsOpen} onRequestClose={closeModal}
        className="p-6 flex items-center justify-center fixed left-0 bottom-0 w-full h-full bg-gray-800 bg-opacity-50">
        <div className="bg-gray-900 rounded shadow-lg p-4 md:p-8 m-4 w-full md:w-3/4 lg:w-1/2">
          <h1 className="text-xl text-white">Are you sure you want to complete?</h1>
          <div className="mt-4">
            <button onClick={closeModal} className="px-4 py-2 mr-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 text-white">Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Confirm</button>
          </div>
        </div>
      </Modal>

      <button
        className={"bg-blue-500 rounded h-12 font-medium text-white w-24 text-lg border border-transparent hover:bg-white transition hover:text-blue-500 cursor-pointer " + className}
        disabled={disabled}
        onClick={openModal}
      >
        Complete
      </button>
    </>
  );
};
