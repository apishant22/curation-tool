import { create } from "zustand";

interface NetworkModalStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useNetworkModal = create<NetworkModalStore>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

export default useNetworkModal;
