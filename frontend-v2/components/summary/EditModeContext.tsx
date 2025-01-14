import React, { createContext, useContext, useState, Dispatch, SetStateAction } from "react";

interface EditModeContextType {
    isEdit: boolean;
    setIsEdit: Dispatch<SetStateAction<boolean>>;
}

const EditModeContext = createContext<EditModeContextType>({
    isEdit: false,
    setIsEdit: () => {},
});

export const EditModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isEdit, setIsEdit] = useState(false);

    return (
        <EditModeContext.Provider value={{ isEdit, setIsEdit }}>
            {children}
        </EditModeContext.Provider>
    );
};

export const useEditMode = () => {
    const context = useContext(EditModeContext);
    if (!context) {
        throw new Error("useEditMode must be used within an EditModeProvider");
    }
    return context;
};
