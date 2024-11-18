"use client";
import React from "react";
import Modal from "./Modal";
import useRegenerateModal from "@/app/hooks/useRegenerateModal";
import RegenerateCard from "../summary/RegenerateCard";
import { Button } from "../ui/button";

const RegenerateModal = () => {
  const regenerateModal = useRegenerateModal();

  const bodyContent = (
    <div>
      <div
        className="overflow-y-auto max-h-[600px] p-4
    ">
        <RegenerateCard />
      </div>
      <div className="flex justify-end p-4">
        <Button>Regenerate</Button>
      </div>
    </div>
  );
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
