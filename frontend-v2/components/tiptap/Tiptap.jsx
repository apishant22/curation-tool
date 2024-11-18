"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useState, useCallback } from "react";
import StarterKit from "@tiptap/starter-kit";
import MarkdownContent from "@/components/summary/MarkdownContent";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import { FaEdit } from "react-icons/fa";

const Tiptap = ({ contentHere }) => {
  const [content, setContent] = useState(contentHere);
  const [isEdit, setIsEdit] = useState(false);
  const [clicked, setClicked] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit, Highlight, Typography],
    content: `<p>${content}</p>`,
    onUpdate({ editor }) {
      setContent(editor.getText());
      console.log(content);
    },
    enableInputRules: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "p-6 border-[1px] focus:outline-none rounded-md",
      },
    },
  });

  const toggleEdit = useCallback(() => {
    setIsEdit((value) => !value);
    setClicked((value) => !value);
  }, []);

  const handleEdit = () => {
    toggleEdit();
  };

  return (
    <>
      <div className="p-6 flex">
        <div className="flex-grow flex items-stretch bg-gray-100 dark:bg-zinc-800 rounded-lg">
          {/* Added bg color to see the expansion */}
          <div className="w-full">
            <div className="mt-4 flex justify-center">
              <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full font-medium">
                AI-Generated Summary
              </span>
            </div>
            {/* {!data.summary && (
                        <div className="flex justify-center items-center min-h-80">
                          <p>No summary available.</p>
                        </div>
                      )} */}
            <div className="p-6">
              {" "}
              <MarkdownContent
                content={content} // Use test content for now
              />
            </div>
          </div>
        </div>
        <div className="p-2">
          <button onClick={handleEdit}>
            <FaEdit
              size={20}
              className={`${
                clicked ? "text-blue-400" : ""
              } hover:text-neutral-400`}
            />
          </button>
        </div>
      </div>
      {isEdit && <EditorContent editor={editor} />}
    </>
  );
};

export default Tiptap;
