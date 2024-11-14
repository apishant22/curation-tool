"use client";

import { useContext, useEffect, useRef } from "react";
import { EditorContext } from "./EditorContext";

import React from "react";

export default function EditorModal() {
  const { initEditor, editorInstanceRef } = useContext(EditorContext);
  const editorRef = useRef(false);
  useEffect(() => {
    if (!editorRef.current) {
      initEditor();
      editorRef.current = true;
    }

    return () => {
      if (
        editorInstanceRef.current &&
        typeof editorInstanceRef.current.destroy === "function"
      ) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, [initEditor, editorInstanceRef]);

  return (
    <>
      <div id="editorjs"></div>
    </>
  );
}
