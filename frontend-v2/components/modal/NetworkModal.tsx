"use client";

import useNetworkModal from "@/app/hooks/useNetworkModal";
import React, { useState } from "react";
import Modal from "./Modal";

const NetworkModal = () => {
  const [loading] = useState(false);
  const networkModal = useNetworkModal();

  const bodyContent = <div className="flex flex-col gap-4">Hello!</div>;

  return (
    <Modal
      disabled={loading}
      isOpen={networkModal.isOpen}
      title="Author's Paper Network"
      onClose={networkModal.onClose}
      body={bodyContent}
    />
  );
};

export default NetworkModal;
