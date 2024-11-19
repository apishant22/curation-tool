"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useState, useCallback } from "react";
import StarterKit from "@tiptap/starter-kit";
import MarkdownContent from "@/components/summary/MarkdownContent";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import { FaEdit } from "react-icons/fa";
import RegenerateCard from "../summary/RegenerateCard";
import { Button } from "../ui/button";
import { IoMdRefreshCircle } from "react-icons/io";
import axios from "axios";
import { Markdown } from "tiptap-markdown";
import toast from "react-hot-toast";

const Tiptap = ({ name, summary }) => {
  const [content, setContent] = useState(summary);
  const [isEdit, setIsEdit] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [contentVal, setContentVal] = useState([]);
  const [input, setInput] = useState("");
  const [reason, setReason] = useState("");
  const [counter, setCounter] = useState(0);

  const handleChange = (value) => {
    setInput(value);
    console.log(value);
  };

  const handleReasonChange = (value) => {
    setReason(value);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("before", contentVal);

    setContentVal((prevContent) => [
      ...prevContent,
      { text: input, reason: reason },
    ]);
    console.log("after", contentVal);
    setCounter(counter + 1);
    setInput("");
    setReason("");
  };

  const handleRegenerate = () => {
    axios
      .post(`http://localhost:3002/regenerate_request/${name}`, {
        contentVal,
      })
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  };

  const toggleOpen = useCallback(() => {
    setIsOpen((value) => !value);
  }, []);

  const acceptEdit = () => {
    setContent(editor.storage.markdown.getMarkdown());
    toast.success("Successfully edited your summary!");
  };

  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: `${content}`,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "p-6 border-[1px] focus:outline-none rounded-md",
      },
    },
  });

  const toggleEdit = useCallback(() => {
    setIsEdit((value) => !value);
  }, []);

  const handleEdit = () => {
    toggleEdit();
  };

  return (
    <>
      <div className="p-6 flex">
        {!isEdit && (
          <div className="flex-grow flex items-stretch bg-gray-100 dark:bg-zinc-800 rounded-lg">
            {/* Added bg color to see the expansion */}
            <div className="w-full">
              <div className="mt-4 flex justify-center">
                <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full font-medium">
                  AI-Generated Summary
                </span>
              </div>
              {!summary && (
                <div className="flex justify-center items-center min-h-80">
                  <p>No summary available.</p>
                </div>
              )}

              <div className="p-6">
                {" "}
                <MarkdownContent
                  content={content} // Use test content for now
                />
              </div>
            </div>
          </div>
        )}

        {isEdit && (
          <div>
            <div className="flex items-center justify-center p-2 rounded-lg border bg-cyan-300 dark:bg-cyan-400">
              <h1 className="text-center font-bold font-sans">Editor Mode</h1>
            </div>
            <EditorContent editor={editor} />
            <div className="flex justify-end p-2">
              <div
                onClick={acceptEdit}
                className=" dark:bg-green-500 bg-green-300 p-2 rounded-md cursor-pointer hover:bg-green-600 transition duration-150">
                Accept
              </div>
            </div>
          </div>
        )}
        <div className="p-2 flex flex-col items-center">
          <div>
            <button onClick={handleEdit}>
              <FaEdit
                size={20}
                className={`hover:scale-105 transition duration-200 ${
                  isEdit ? "text-blue-400" : ""
                } hover:text-neutral-500`}
              />
            </button>
          </div>
          <div>
            <button onClick={toggleOpen}>
              <IoMdRefreshCircle
                size={25}
                className={` hover:text-green-600 hover:scale-105 transition duration-200 ${
                  isOpen ? "text-green-600" : "text-green-500"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="bg-zinc-100/75 dark:bg-zinc-800 rounded-md mt-6">
          <h1 className="text-center font-bold p-4 font-sans">
            Regenerate your summary!
          </h1>

          <div
            className="overflow-y-auto flex justify-center max-h-[800px] p-4
      ">
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
            />
          </div>
          <div className="flex justify-end p-4">
            <Button
              className="bg-blue-500 hover:bg-blue-700 dark:text-white"
              onClick={handleRegenerate}>
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default Tiptap;
