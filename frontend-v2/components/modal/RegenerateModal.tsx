"use client";
import React from "react";
import Modal from "./Modal";
import useRegenerateModal from "@/app/hooks/useRegenerateModal";
import RegenerateCard from "../summary/RegenerateCard";

interface RegenerateModalProps {
  contentVal: string;
  handleSubmit: () => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleReasonChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  input: string;
  reason: string;
  counter: number;
  setContentVal: React.Dispatch<React.SetStateAction<string>>;
  setCounter: React.Dispatch<React.SetStateAction<number>>;
  handleRegenerate: () => void;
}
const RegenerateModal : React.FC<RegenerateModalProps>= ({
  contentVal,
  handleSubmit,
  handleChange,
  handleReasonChange,
  input,
  reason,
  counter,
  setContentVal,
  setCounter,
  handleRegenerate,
}) => {


  const regenerateModal = useRegenerateModal();

  const bodyContent = (
    <RegenerateCard
      contentVal={contentVal}
      handleSubmit={handleSubmit}
      handleChange={handleChange}
      handleReasonChange={handleReasonChange}
      input={input}
      reason={reason}
      counter={counter}
      setContentVal={setContentVal}
      setCounter={setCounter}
      //name={name}
      handleRegenerate={handleRegenerate}
    />
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
