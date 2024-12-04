"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import MarkdownContent from "../summary/MarkdownContent";
import { FaBold, FaItalic, FaUnderline } from "react-icons/fa";
import { MdFormatListBulleted, MdFormatListNumbered } from "react-icons/md";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const Tiptap = ({ summary }) => {
    const [content, setContent] = useState(summary);
    const [isEdit, setIsEdit] = useState(false); // Toggle for editor mode
    const [selectedText, setSelectedText] = useState("");
    const [improvementReason, setImprovementReason] = useState("");
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const editor = useEditor({
        extensions: [StarterKit, Underline, BulletList, OrderedList],
        content: content,
        editorProps: {
            attributes: {
                class: "p-4 border focus:outline-none rounded-md min-h-[200px]",
            },
        },
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML());
        },
    });

    const toggleEdit = () => {
        setIsEdit((prev) => !prev);
    };

    const handleMouseUp = () => {
        const selection = window.getSelection();
        const text = selection?.toString();
        if (text) {
            setSelectedText(text);
        }
    };

    const applyImprovement = () => {
        if (editor && selectedText && improvementReason) {
            const updatedContent = content.replace(selectedText, improvementReason);
            editor.commands.setContent(updatedContent);
            toast.success("Improvement applied!");
            setIsPopupOpen(false);
            setImprovementReason("");
        }
    };

    const renderToolbar = () => (
        <div className="flex items-center gap-4 mb-4 bg-gray-100 dark:bg-zinc-800 p-2 rounded-lg">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className="hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-md"
            >
                <FaBold size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className="hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-md"
            >
                <FaItalic size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className="hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-md"
            >
                <FaUnderline size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className="hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-md"
            >
                <MdFormatListBulleted size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className="hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-md"
            >
                <MdFormatListNumbered size={16} />
            </button>
        </div>
    );

    useEffect(() => {
        if (editor) {
            editor.view.dom.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            if (editor) {
                editor.view.dom.removeEventListener("mouseup", handleMouseUp);
            }
        };
    }, [editor]);

    return (
        <div className="p-6">
            {/* Title and Button Section */}
            <div className="flex justify-between items-center mb-6">
                <div className="text-lg font-bold uppercase">Adriana Wilde</div>
                <button
                    onClick={toggleEdit}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600"
                >
                    {isEdit ? "Exit Editor Mode" : "Enter Editor Mode"}
                </button>
            </div>

            {/* Content Section */}
            {!isEdit ? (
                <div className="flex-grow bg-gray-100 dark:bg-zinc-800 rounded-lg p-6 shadow-md">
                    {/* AI-Generated Summary Label */}
                    <div className="text-sm font-medium px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full mb-6 text-center">
                        AI-Generated Summary
                    </div>
                    {/* Markdown Content */}
                    <MarkdownContent content={content} />
                </div>
            ) : (
                <>
                    {renderToolbar()}
                    <EditorContent editor={editor} />
                </>
            )}

            {/* Improvement Popup */}
            {isPopupOpen && (
                <div className="popup bg-white p-4 rounded-md shadow-lg fixed top-1/3 left-1/3">
                    <h3 className="font-bold mb-2">Improve Text</h3>
                    <p className="text-sm mb-4">Selected Text: {selectedText}</p>
                    <textarea
                        className="w-full p-2 border rounded-md mt-2"
                        placeholder="Enter your improvement"
                        value={improvementReason}
                        onChange={(e) => setImprovementReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            className="bg-green-500 text-white px-4 py-2 rounded-md"
                            onClick={applyImprovement}
                        >
                            Apply
                        </button>
                        <button
                            className="bg-gray-500 text-white px-4 py-2 rounded-md"
                            onClick={() => setIsPopupOpen(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tiptap;
