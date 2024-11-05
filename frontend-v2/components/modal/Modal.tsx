"use client";

import React, { useCallback, useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";

interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  title?: string;
  body?: React.ReactElement;
  disabled?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  body,
  disabled,
}) => {
  // do the open and close modal here
  const [showModal, setShowModal] = useState(isOpen);

  // useeffect here
  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  // close the modal, this one need to useCallback
  const handleClose = useCallback(() => {
    if (disabled) {
      return;
    }
    setShowModal(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [disabled, onClose]);

  // if not open the modal, return null
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* overall layout background here */}
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-neutral-800/70 outline-none focus:outline-none">
        {/* positioning of the content here */}
        <div className="relative mx-auto h-full w-full md:h-auto md:w-4/6 lg:h-auto lg:w-3/6 xl:w-2/5">
          {/* WHOLE CONTENT */}
          <div
            className={`translate h-full duration-300 ${
              showModal ? "translate-y-0" : "translate-y-full"
            } ${showModal ? "opacity-100" : "opacity-0"}`}>
            {/* postioning of content inside */}

            <div className="translate relative flex h-full w-full flex-col rounded-lg border-0 bg-white shadow-lg outline-none focus:outline-none md:h-auto lg:h-auto">
              {/* HEADER */}
              <div className="relative flex items-center justify-center rounded-t border-b-[1px] p-6">
                <button
                  onClick={handleClose}
                  className="absolute left-9 border-0 p-1 transition hover:opacity-70">
                  <IoMdClose size={18} />
                </button>
                <div className="text-lg font-semibold">{title}</div>
              </div>
              {/* BODY */}
              <div className="relative flex-auto flex justify-center overflow-auto items-center p-6">
                <div>{body}</div>
              </div>
              {/* FOOTER */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
