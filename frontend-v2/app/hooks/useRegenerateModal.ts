import { create } from "zustand";

interface RegenerateModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useRegenerateModal = create<RegenerateModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useRegenerateModal;
