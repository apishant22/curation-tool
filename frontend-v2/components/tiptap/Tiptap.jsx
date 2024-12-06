"use client";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import Paragraph from "@tiptap/extension-paragraph"
import ListItem from '@tiptap/extension-list-item'
import OrderedList from '@tiptap/extension-ordered-list'
import BulletList from '@tiptap/extension-bullet-list'
import MarkdownContent from "../summary/MarkdownContent";
import {FaBold, FaItalic, FaLink, FaPen, FaEdit, FaTrashAlt, FaSave} from "react-icons/fa";
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
    const [improvementRequests, setImprovementRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: false,
                orderedList: false,
                paragraph: false,
            }),
            BulletList.configure({
                HTMLAttributes: {
                    class: 'list-disc ml-6 text-gray-600 dark:text-neutral-200',
                },
                keepMarks: true,
                keepAttributes: true,
            }),
            OrderedList.configure({
                HTMLAttributes: {
                    class: 'list-decimal ml-6 text-gray-600 dark:text-neutral-200',
                },
            }),
            ListItem.configure({
                HTMLAttributes: {
                    class: 'mb-2 text-gray-600 dark:text-neutral-200',
                },
            }),
            Paragraph.configure({
                HTMLAttributes: {
                    class: 'mb-3 text-gray-600 leading-relaxed dark:text-neutral-200',
                },
            }),
            Underline,
            Markdown,
            Heading.configure({
                levels: [1, 2, 3],
                HTMLAttributes: {
                    class: '',
                },
            }).extend({
                addOptions() {
                    return {
                        ...this.parent?.(),
                        HTMLAttributes: {
                            1: 'text-2xl font-bold mb-4 text-gray-800 dark:text-white',
                            2: 'text-xl font-semibold mt-6 mb-3 text-gray-700 dark:text-white',
                            3: 'text-lg font-semibold mt-4 mb-2 text-gray-600 dark:text-white',
                        },
                    };
                },
                renderHTML({ node }) {
                    const level = node.attrs.level;
                    const attributes = this.options.HTMLAttributes[level] || {};
                    return [`h${level}`, { class: attributes }, 0];
                },
            }),
            Link.configure({
                HTMLAttributes: {
                    class: 'text-blue-600 dark:text-blue-400 hover:text-blue-800 underline',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                },
            }),
        ],
        content: `${content}`,
        editorProps: {
            attributes: {
                class: 'p-6 border-[1px] focus:outline-none rounded-md prose prose-sm dark:prose-invert max-w-none',
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
        if (text) {
            setSelectedText(text);
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
            <div className={`relative z-0 flex flex-col w-full p-6 gap-4 transition-all duration-500 ease-out ${isEdit ? 'z-20' : ''}`}>
                {/* Editor Button Outside */}
                <div className={`flex justify-end ${isEdit ? 'relative z-20 mb-4 -top-4' : ''}`}>
                    <button
                        onClick={toggleEdit}
                        className={`px-3 py-3 flex items-center text-white rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-300 ease-in-out ${isEdit ? '-translate-y-48 translate-x-6' : ''} ${isEdit ? 'relative z-20' : ''}`}
                        style={{
                            background: 'linear-gradient(to right, #4f46e5, #3b82f6)',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                        }}
                    >
                        {isEdit ? (
                            <>
                                <FaSave className="mr-2" />
                                Save Changes
                            </>
                        ) : (
                            <>
                                <FaPen className="mr-2" />
                                Enter Editor Mode
                            </>
                        )}
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
                                <div className="text-sm font-medium px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full mb-6 text-center z-0">
                                    AI-Generated Summary
                                </div>
                                <MarkdownContent content={content} />
                            </>
                        ) : (
                            <>
                                {renderToolbar()}
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <div className="relative">
                                        {editor && (
                                            <BubbleMenu
                                                editor={editor}
                                                tippyOptions={{
                                                    duration: 100,
                                                    placement: "bottom-end",
                                                    offset: [0, -20],
                                                    popperOptions: {
                                                        modifiers: [
                                                            {
                                                                name: "preventOverflow",
                                                                options: {
                                                                    boundary: "viewport",
                                                                },
                                                            },
                                                            {
                                                                name: "flip",
                                                                options: {
                                                                    fallbackPlacements: ["top"],
                                                                },
                                                            },
                                                        ],
                                                    },
                                                }}
                                            >
                                                <div
                                                    className="flex items-center justify-center p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105"
                                                >
                                                    <button
                                                        onClick={() => setIsPopupOpen(true)}
                                                        title="Improve it"
                                                        className="flex items-center justify-center"
                                                    >
                                                        <FaPen size={18} className="text-white" />
                                                    </button>
                                                </div>
                                            </BubbleMenu>
                                        )}
                                        <EditorContent editor={editor} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>;

                {/* Improvement Popup */}
                {isEdit && isPopupOpen && (
                    <div className="popup right-8 w-[600px] h-[350px] bg-white p-4 rounded-lg shadow-lg fixed bottom-5 z-30 transition-all duration-500">
                        <h3 className="font-bold mb-2 text-lg">Improve Text</h3>
                        <div className="max-h-[125px] overflow-y-auto mb-3 p-2 bg-gray-200 rounded-md border-l-4 border-blue-500">
                            {selectedText}
                        </div>
                        <textarea
                            className="w-full p-3 border rounded-md text-gray-900 dark:bg-zinc-800 dark:text-gray-200 focus:border-blue-500 mb-3 resize-none"
                            placeholder="Enter your improvement"
                            value={improvementReason}
                            onChange={(e) => setImprovementReason(e.target.value)}
                        />
                        <div className="flex justify-end gap-4 mt-2">
                            <button
                                className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-600 transition-transform duration-300 ease-in-out flex items-center gap-1"
                                onClick={applyImprovement}
                            >
                                ✓ Apply
                            </button>
                            <button
                                className="bg-gray-500 text-white px-4 py-2 rounded-md shadow hover:bg-gray-600 transition-transform duration-300 ease-in-out flex items-center gap-1"
                                onClick={() => setIsPopupOpen(false)}
                            >
                                ✕ Cancel
                            </button>
                        </div>
                    </div>
                )}
                {/* Improvement Requests Timeline */}
                {isEdit && improvementRequests.length > 0 && (
                    <div className="fixed right-8 top-9 w-[600px] max-h-[58vh] p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md transition-all duration-500 ease-in-out">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold border-b-2 border-blue-500">Improvement List</h3>
                            <button
                                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 ease-in-out"
                                onClick={handleRegenerate}
                            >
                                Regenerate
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[48vh] flex flex-col gap-4">
                            {improvementRequests.map((request, index) => (
                                <div key={index} className="p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg shadow-sm border border-gray-200">
                                    <div className="mb-2">
                                        <p className="text-sm font-bold text-gray-800">Selected Text:</p>
                                        <blockquote className="text-sm bg-gray-100 dark:bg-zinc-600 p-2 rounded-md mt-1 mb-4 overflow-y-auto border-l-4 border-blue-500">
                                            {request.text}
                                        </blockquote>
                                    </div>
                                    <div className="mb-2">
                                        <p className="text-sm font-bold text-gray-800">Reason:</p>
                                        <p className="text-sm mt-1">{request.reason}</p>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <button
                                            onClick={() => handleEditRequest(index)}
                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRequest(index)}
                                            className="text-red-600 hover:text-red-800 transition-colors"
                                        >
                                            <FaTrashAlt />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tiptap;
