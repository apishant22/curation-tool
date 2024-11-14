"use client";
import { createContext, useRef } from "react";
import EditorJS from "@editorjs/editorjs";

export const EditorContext = createContext();

function EditorContextProvider(props) {
  const editorInstanceRef = useRef(null);
  const initEditor = () => {
    editorInstanceRef.current = new EditorJS({
      holder: "editorjs",
      placeholder: "Let's take a note!",
      tools: {},
      onChange: () => {
        console.log(editorInstanceRef);
      },
    });
  };
  return (
    <EditorContext.Provider value={{ initEditor, editorInstanceRef }}>
      {props.children}
    </EditorContext.Provider>
  );
}

export default EditorContextProvider;
