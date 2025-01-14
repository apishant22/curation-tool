import React, { createContext, useContext, useState } from "react";

const EditModeContext = createContext();

export const EditModeProvider = ({ children }) => {
    const [isEdit, setIsEdit] = useState(false);
    return (
        <EditModeContext.Provider value={{ isEdit, setIsEdit }}>
    {children}
    </EditModeContext.Provider>
);
};

export const useEditMode = () => useContext(EditModeContext);
