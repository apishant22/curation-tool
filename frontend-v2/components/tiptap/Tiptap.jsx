"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import MarkdownContent from "../summary/MarkdownContent";
import { FaBold, FaItalic, FaLink, FaPen, FaEdit, FaTrashAlt } from "react-icons/fa";
import { MdFormatListBulleted, MdFormatListNumbered } from "react-icons/md";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Markdown } from "tiptap-markdown";
import axios from "axios";

const Tiptap = ({ name, summary }) => {
    const [content, setContent] = useState(summary);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedText, setSelectedText] = useState("");
    const [improvementReason, setImprovementReason] = useState("");
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isPenVisible, setIsPenVisible] = useState(false);
    const [penPosition, setPenPosition] = useState({ top: 0, left: 0 });
    const [improvementRequests, setImprovementRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    HTMLAttributes: {
                        class: 'ml-6 list-disc'
                    }
                },
                orderedList: {
                    HTMLAttributes: {
                        class: 'ml-6 list-decimal'
                    }
                }
            }),
            Underline,
            Heading.configure({ levels: [1, 2, 3] }),
            Link,
            Markdown
        ],
        content: `${content}`,
        editorProps: {
            attributes: {
                class: "p-6 border-[1px] focus:outline-none rounded-md prose prose-sm dark:prose-invert max-w-none",
            },
        },
    });

    const toggleEdit = async () => {
        if (isEdit && editor) {
            try {
                const markdownContent = editor.storage.markdown.getMarkdown();
                setContent(markdownContent);
            } catch (err) {
                console.error("Error saving changes:", err);
                toast.error("Failed to save changes.");
            }
        }
        setIsEdit((prev) => !prev);
    };

    const handleMouseUp = () => {
        const selection = window.getSelection();
        const text = selection?.toString();
        if (text && text.trim().split(/\s+/).length > 1) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            let top = rect.bottom + window.scrollY + 2;
            let left = rect.left + window.scrollX + rect.width / 2 - 16;

            // Adjust position if there's not enough space below the selection
            if (window.innerHeight - rect.bottom < 50) {
                top = rect.top + window.scrollY - 30; // Move above the selection
            }

            setSelectedText(text);
            setIsPenVisible(true);
            setPenPosition({ top, left });
        } else {
            setIsPenVisible(false);
        }
    };

    const applyImprovement = () => {
        if (editor && selectedText && improvementReason) {
            const updatedContent = content.replace(
                selectedText,
                `${selectedText}`
            );
            editor.commands.setContent(updatedContent);
            setIsPopupOpen(false);
            setImprovementReason("");
            setIsPenVisible(false);

            setImprovementRequests(prevRequests => [
                ...prevRequests,
                { text: selectedText, reason: improvementReason }
            ]);
        }
    };

    const handleRegenerate = async () => {
        try {
            setLoading(true);
            setIsEdit(false);
            toast.success("Regenerating your summary!");
            const response = await axios.post(
                `http://localhost:3002/regenerate_request/${name}`,
                {
                    contentVal: improvementRequests,
                }
            );
            setContent(response.data);
            setSelectedText("");
            setImprovementReason("");
            setIsPopupOpen(false);
            setIsPenVisible(false);
            setImprovementRequests([]);
            if (editor) {
                editor.commands.setContent(response.data);
            }
            toast.success("Summary has been updated!");
        } catch (error) {
            console.error("Regenerate summary failed:", error);
            toast.error("Regenerate summary failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRequest = (index) => {
        setImprovementRequests((prevRequests) => prevRequests.filter((_, i) => i !== index));
    };

    const handleEditRequest = (index) => {
        const request = improvementRequests[index];
        setSelectedText(request.text);
        setImprovementReason(request.reason);
        setIsPopupOpen(true);
        handleDeleteRequest(index);
    };

    const renderToolbar = () => (
        <div className="flex items-center gap-4 mb-4 bg-gray-100 dark:bg-zinc-800 p-2 rounded-lg">
            <button
                onClick={() => {
                    editor.chain().focus().toggleBold().run();
                    toast.success("Bold formatting applied!");
                }}
                className="hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-md"
                title="Bold"
            >
                <FaBold size={16} />
            </button>
            <button
                onClick={() => {
                    editor.chain().focus().toggleItalic().run();
                    toast.success("Italic formatting applied!");
                }}
                className="hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-md"
                title="Italic"
            >
                <FaItalic size={16} />
            </button>
            <button
                onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 1 }).run();
                    toast.success("Heading 1 applied!");
                }}
                className="hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-md"
                title="Heading 1"
            >
                H<sub>1</sub>
            </button>
            <button
                onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 2 }).run();
                    toast.success("Heading 2 applied!");
                }}
                className="hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-md"
                title="Heading 2"
            >
                H<sub>2</sub>
            </button>
            <button
                onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 3 }).run();
                    toast.success("Heading 3 applied!");
                }}
                className="hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-md"
                title="Heading 3"
            >
                H<sub>3</sub>
            </button>
            <button
                onClick={() => {
                    editor.chain().focus().toggleBulletList().run();
                    toast.success("Bullet list applied!");
                }}
                className="hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-md"
                title="Bullet List"
            >
                <MdFormatListBulleted size={16} />
            </button>
            <button
                onClick={() => {
                    editor.chain().focus().toggleOrderedList().run();
                    toast.success("Ordered list applied!");
                }}
                className="hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-md"
                title="Ordered List"
            >
                <MdFormatListNumbered size={16} />
            </button>
            <button
                onClick={() => {
                    if (editor.isActive('link')) {
                        editor.chain().focus().unsetLink().run();
                        toast.success("Link removed!");
                    } else {
                        const url = prompt("Enter the URL");
                        if (url) {
                            const formattedUrl = !/^https?:\/\//i.test(url) ? `https://${url}` : url;
                            editor.chain().focus().setLink({ href: formattedUrl }).run();
                            toast.success("Link added!");
                        }
                    }
                }}
                className="hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-md"
                title="Link"
            >
                <FaLink size={16} />
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
        <div className="relative w-full min-h-screen">
            {isEdit && (
                <div
                    className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md z-10 transition-opacity duration-500 ease-out ${isEdit ? 'opacity-100' : 'opacity-0'}`}
                ></div>
            )}
            <div className={`relative z-20 flex flex-col w-full p-6 gap-4 transition-all duration-500 ease-out ${isEdit ? '' : ''}`}>
                {/* Editor Button Outside */}
                <div className={`flex justify-end ${isEdit ? 'relative z-20 mb-4' : ''}`}>
                    <button
                        onClick={toggleEdit}
                        className={`px-4 py-2 bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 transition-transform transform duration-500 ease-in-out ${isEdit ? '-translate-y-48 translate-x-6' : ''} ${isEdit ? 'relative z-20' : ''}`}
                    >
                        {isEdit ? "Save Changes" : "Enter Editor Mode"}
                    </button>
                </div>

                {/* Summary Panel */}
                <div
                    className={`flex flex-col w-full lg:w-[100%] mx-auto bg-gray-100 dark:bg-zinc-800 rounded-lg shadow-md transition-all duration-500 ease-in-out ${
                        isEdit ? "-translate-y-40 shadow-2xl transform scale-105 relative z-20" : ""
                    }`}
                >
                    <div className="p-6">
                        {loading ? (
                            <div className="flex flex-col justify-center items-center min-h-[200px]">
                                <div className="animate-spin h-8 w-8 border-4 border-gray-500 border-t-transparent rounded-full" />
                                <p className="mt-4 text-gray-600 dark:text-white">Regenerating...</p>
                            </div>
                        ) : !isEdit ? (
                            <>
                                <div className="text-sm font-medium px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full mb-6 text-center">
                                    AI-Generated Summary
                                </div>
                                <MarkdownContent content={content} />
                            </>
                        ) : (
                            <>
                                {renderToolbar()}
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <EditorContent editor={editor} />
                                </div>
                            </>
                        )}
                    </div>
                </div>;

                {/* Pen Icon for Improvement */}
                {isEdit && isPenVisible && (
                    <div
                        className="absolute z-30 cursor-pointer bg-white p-2 rounded-full shadow-md transition-transform duration-300 ease-out"
                        style={{
                            top: penPosition.top - 220,
                            left: penPosition.left - 340,
                        }}
                        onClick={() => setIsPopupOpen(true)}
                        title="Improve it"
                    >
                        <FaPen size={16} className="text-blue-500" />
                    </div>
                )}

                {/* Improvement Popup */}
                {isEdit && isPopupOpen && (
                    <div className="popup right-8 w-[600px] bg-white p-4 rounded-md shadow-lg fixed bottom-5 z-30 transition-all duration-500 max-h-[400px] overflow-auto">
                        <h3 className="font-bold mb-2 text-lg">Improve Text</h3>
                        <blockquote className="bg-gray-100 p-2 rounded-md mb-4 text-gray-700 dark:bg-zinc-700 dark:text-gray-200 max-h-[150px] overflow-y-auto">
                            {selectedText}
                        </blockquote>
                        <textarea
                            className="w-full p-2 border rounded-md mt-2 text-gray-900 dark:bg-zinc-800 dark:text-gray-200"
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
                {/* Improvement Requests Timeline */}
                {isEdit && improvementRequests.length > 0 && (
                    <div className="fixed right-8 top-9 w-[600px] max-h-[58vh] p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md transition-all duration-500 ease-in-out">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Improvement List</h3>
                            <button
                                className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                                onClick={handleRegenerate}
                            >
                                Regenerate
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[48vh]">
                            <ul className="flex flex-col gap-3">
                                {improvementRequests.map((request, index) => (
                                    <li key={index} className="p-4 bg-gray-100 dark:bg-zinc-700 rounded-md">
                                        <p className="text-sm font-semibold">Selected Text:</p>
                                        <blockquote className="text-sm mb-2">{request.text}</blockquote>
                                        <p className="text-sm font-semibold">Reason:</p>
                                        <blockquote className="text-sm mb-2">{request.reason}</blockquote>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEditRequest(index)}
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRequest(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <FaTrashAlt />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tiptap;
