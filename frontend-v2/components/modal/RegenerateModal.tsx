"use client";
import React from "react";
import Modal from "./Modal";
import useRegenerateModal from "@/app/hooks/useRegenerateModal";

const RegenerateModal = ({}) => {
  const regenerateModal = useRegenerateModal();

  const bodyContent = <div></div>;
  return (
    <Modal
      onClose={regenerateModal.onClose}
      isOpen={regenerateModal.isOpen}
      title="Regenerate your content!"
      body={bodyContent}
    />
  );
};

export default RegenerateModal;
