"use client";

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import Paragraph from "@tiptap/extension-paragraph";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import BulletList from "@tiptap/extension-bullet-list";
import MarkdownContent from "../summary/MarkdownContent";
import {
  FaBold,
  FaItalic,
  FaLink,
  FaPen,
  FaEdit,
  FaTrashAlt,
  FaSave,
  FaUndo,
  FaRedo
} from "react-icons/fa";
import {
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdOutlineIosShare,
} from "react-icons/md";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Markdown } from "tiptap-markdown";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { IoMdArrowBack, IoMdCheckmark, IoMdClose } from "react-icons/io";
import { useRouter } from "next/navigation";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import {useEditMode} from "@/components/summary/EditModeContext";

const Tiptap = ({ name, summary }) => {
  const [content, setContent] = useState(summary);
  const { isEdit, setIsEdit } = useEditMode();
  const [selectedText, setSelectedText] = useState("");
  const [improvementReason, setImprovementReason] = useState("");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [improvementRequests, setImprovementRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [isTourRunning, setIsTourRunning] = useState(false);
  const [isImprovementPopupOpen, setImprovementPopupOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const capitalizedName = capitalizeWords(name);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        paragraph: false,
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc ml-6 text-gray-600 dark:text-neutral-200",
        },
        keepMarks: true,
        keepAttributes: true,
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal ml-6 text-gray-600 dark:text-neutral-200",
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: "mb-2 text-gray-600 dark:text-neutral-200",
        },
      }),
      Paragraph.configure({
        HTMLAttributes: {
          class: "mb-3 text-gray-600 leading-relaxed dark:text-neutral-200",
          style: "margin-top: 0.5em;",
        },
      }),
      Underline,
      Markdown,
      Heading.configure({
        levels: [1, 2, 3],
        HTMLAttributes: {
          class: "",
        },
      }).extend({
        addOptions() {
          return {
            ...this.parent?.(),
            HTMLAttributes: {
              1: "text-2xl font-bold mb-4 text-gray-800 dark:text-white",
              2: "text-xl font-semibold mt-6 mb-3 text-gray-700 dark:text-white",
              3: "text-lg font-semibold mt-4 mb-2 text-gray-600 dark:text-white",
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
          class:
            "text-blue-600 dark:text-blue-400 hover:text-blue-800 underline",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    ],
    content: `${content}`,
    editorProps: {
      attributes: {
        class:
          "p-6 border-[1px] focus:outline-none rounded-md prose prose-sm dark:prose-invert max-w-none",
      },
    },
  });

  const handleExport = (format) => {
    if (!editor) {
      toast.error("Editor content is not available for export.");
      return;
    }

    let content;
    switch (format) {
      case "html":
        content = editor.getHTML();
        break;
      case "markdown":
        content = editor.storage.markdown?.getMarkdown();
        break;
    }

    const formattedName = name.replace(/\s+/g, "_");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formattedName}_summary.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setIsExportModalOpen(false);

    toast.success(`Content exported as ${format.toUpperCase()}!`);
  };

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
      const updatedContent = content.replace(selectedText, `${selectedText}`);
      editor.commands.setContent(updatedContent);
      setIsPopupOpen(false);
      setImprovementReason("");

      setImprovementRequests((prevRequests) => [
        ...prevRequests,
        { text: selectedText, reason: improvementReason },
      ]);
    }
  };

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  const handleRegenerate = async () => {
    try {
      setLoading(true);
      setIsEdit(false);
      toast.success("Regenerating your summary!");
      const response = await axios.post(
        `${BASE_URL}/regenerate_request/${name}`,
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
    setImprovementRequests((prevRequests) =>
      prevRequests.filter((_, i) => i !== index)
    );
  };

  const handleUpdateSummary = async (content) => {
    try {
      setLoading(true);
      const response = await axios.post(`${BASE_URL}/update_summary/${name}`, {
        content: content,
        name: name,
      });
      if (response.status === 200) {
        console.log("Summary successfully updated!");
      } else {
        console.log("Failed to update the summary.");
      }
    } catch (error) {
      console.error("Update summary failed:", error);
      toast.error("An error occurred while updating the summary.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSumamry = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
          `${BASE_URL}/remove_summary/${encodeURIComponent(name)}`,
          {},
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
      );
      if (response.status === 200) {
        console.log("Author summary successfully removed!");
        router.push("/");
      } else {
        console.log("Failed to remove the author summary.");
      }
    } catch (error) {
      console.error("Remove author summary failed:", error);
      if (error.response && error.response.data && error.response.data.error) {
        console.log(`Error: ${error.response.data.error}`);
      } else {
        console.log("An error occurred while removing the author summary.");
      }
    } finally {
      setLoading(false);
    }
  }


  const handleRemoveAuthor = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${BASE_URL}/remove_author/${encodeURIComponent(name)}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        console.log("Author successfully removed!");
        router.push("/");
      } else {
        console.log("Failed to remove the author.");
      }
    } catch (error) {
      console.error("Remove author failed:", error);
      if (error.response && error.response.data && error.response.data.error) {
        console.log(`Error: ${error.response.data.error}`);
      } else {
        console.log("An error occurred while removing the author.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditRequest = (index) => {
    const request = improvementRequests[index];
    setSelectedText(request.text);
    setImprovementReason(request.reason);
    setIsPopupOpen(true);
    handleDeleteRequest(index);
  };

  const renderToolbar = () => (
      <div className="editor-toolbar flex items-center gap-4 mb-4 bg-gray-100 dark:bg-zinc-800 p-2 rounded-lg">
        <div className="flex gap-2 mr-4">
          <button
              onClick={() => editor.chain().focus().undo().run()}
              className="hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-md"
              title="Undo"
          >
            <FaUndo size={16} />
          </button>
          <button
              onClick={() => editor.chain().focus().redo().run()}
              className="hover:bg-gray-200 dark:hover:bg-zinc-700 p-2 rounded-md"
              title="Redo"
          >
            <FaRedo size={16} />
          </button>
        </div>
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
              if (editor.isActive("link")) {
                editor.chain().focus().unsetLink().run();
                toast.success("Link removed!");
              } else {
                const url = prompt("Enter the URL");
                if (url) {
                  const formattedUrl = !/^https?:\/\//i.test(url)
                      ? `https://${url}`
                      : url;
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
        {isClient && (
            <button
                onClick={() => {
                  if (!isTourRunning) {
                    setIsTourRunning(true);
                    startTour();
                  }
                }}
                className="ml-auto text-gray-800 hover:text-gray-600 text-2xl font-semibold focus:outline-none"
                title="Start Guided Tour"
            >
              𝒾
            </button>
        )}
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

  const startTour = () => {
    if (!isClient) return;

    if (window.currentTour) {
      window.currentTour.cancel();
      window.currentTour = null;
    }

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        scrollTo: false,
        cancelIcon: {
          enabled: true,
        },
        classes: "custom-shepherd",
      },
      modalOverlayOpeningPadding: 10,
    });

    window.currentTour = tour;

    tour.addStep({
      id: "editor-container",
      text: "This is your AI-generated summary editor. You can refine the summary here.",
      attachTo: { element: ".editor-container", on: "bottom" },
      buttons: [
        {
          text: "Next",
          action: tour.next,
        },
      ],
    });

    tour.addStep({
      id: "editor-toolbar",
      text: "Use these tools to format text, add headings, lists, or links.",
      attachTo: { element: ".editor-toolbar", on: "bottom" },
      buttons: [
        {
          text: "Back",
          action: tour.back,
        },
        {
          text: "Next",
          action: () => {
            document.querySelector(".regenerate-summary")?.scrollIntoView({
              behavior: "auto",
            });
            tour.next();
          },
        },
      ],
    });

    tour.addStep({
      id: "regenerate-summary",
      text: "Use this to regenerate the entire text",
      attachTo: { element: ".regenerate-summary", on: "bottom" },
      highlightClass: "shepherd-highlight",
      buttons: [
        {
          text: "Back",
          action: () => {
            document.querySelector(".editor-toolbar")?.scrollIntoView({
              behavior: "smooth",
            });
            tour.back();
          },
        },
        {
          text: "Next",
          action: () => {
            document.querySelector(".editor-toolbar")?.scrollIntoView({
              behavior: "smooth",
            });
            tour.next();
          },
        },
      ],
    });

    tour.addStep({
      id: "bubble-menu-pen",
      text: "Or highlight some text in the editor and click the pen icon to improve the text.",
      attachTo: { element: ".bubble-menu-pen", on: "bottom" },
      buttons: [
        {
          text: "Back",
          action: () => {
            document.querySelector(".regenerate-summary")?.scrollIntoView({
              behavior: "smooth",
            });
            tour.back();
          },
        },
      ],
      when: {
        show: function () {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const step = this;

          let improvementPopup = document.querySelector(".improvement-popup");
          if (improvementPopup && isImprovementPopupOpen) {
            step.updateStepOptions({
              buttons: [
                {
                  text: "Back",
                  action: function () {
                    setImprovementPopupOpen(true);
                    tour.back();
                  },
                },
                { text: "Next", action: tour.next },
              ],
            });
          } else {
            const observer = new MutationObserver(() => {
              improvementPopup = document.querySelector(".improvement-popup");
              if (improvementPopup) {
                observer.disconnect();
                step.observer = null;
                step.updateStepOptions({
                  buttons: [
                    {
                      text: "Back",
                      action: function () {
                        setImprovementPopupOpen(true);
                        tour.back();
                      },
                    },
                  ],
                });
                tour.next();
              }
            });

            observer.observe(document.body, { childList: true, subtree: true });
            step.observer = observer;
          }
        },
        hide: function () {
          if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
          }
        },
      },
    });

    tour.addStep({
      id: "improvement-popup",
      text: "Here you can enter your improvement suggestion for the selected text.",
      attachTo: { element: ".improvement-popup", on: "bottom" },
      buttons: [
        {
          text: "Back",
          action: tour.back,
        },
        { text: "Next", action: tour.cancel },
      ],
      when: {
        show: function () {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const step = this;

          const removalObserver = new MutationObserver(() => {
            if (
              !document.querySelector(".improvement-popup") &&
              !document.querySelector(".improvement-timeline")
            ) {
              removalObserver.disconnect();
              step.removalObserver = null;
              tour.back();
            }
          });
          removalObserver.observe(document.body, {
            childList: true,
            subtree: true,
          });
          step.removalObserver = removalObserver;

          // Check if timeline present
          if (document.querySelector(".improvement-timeline")) {
            step.updateStepOptions({
              buttons: [
                {
                  text: "Back",
                  action: tour.back,
                },
                {
                  text: "Next",
                  action: tour.next,
                },
              ],
            });
          } else {
            const timelineObserver = new MutationObserver(() => {
              if (document.querySelector(".improvement-timeline")) {
                timelineObserver.disconnect();
                step.timelineObserver = null;
                step.updateStepOptions({
                  buttons: [
                    {
                      text: "Back",
                      action: tour.back,
                    },
                    {
                      text: "Next",
                      action: tour.next,
                    },
                  ],
                });
                tour.next();
              }
            });
            timelineObserver.observe(document.body, {
              childList: true,
              subtree: true,
            });
            step.timelineObserver = timelineObserver;
          }
        },
        hide: function () {
          if (this.removalObserver) {
            this.removalObserver.disconnect();
            this.removalObserver = null;
          }
          if (this.timelineObserver) {
            this.timelineObserver.disconnect();
            this.timelineObserver = null;
          }
        },
      },
    });

    tour.addStep({
      id: "improvement-timeline",
      text: "All your improvement requests appear here. You can edit or remove them.",
      attachTo: { element: ".improvement-timeline", on: "bottom" },
      buttons: [
        {
          text: "Next",
          action: tour.next,
        },
      ],
    });

    tour.addStep({
      id: "regenerate-button",
      text: "Once satisfied with your improvements, click here to regenerate the summary with those changes.",
      attachTo: { element: ".regenerate-button", on: "bottom" },
      buttons: [
        {
          text: "Back",
          action: tour.back,
        },
        {
          text: "Done",
          action: tour.complete,
        },
      ],
    });

    tour.start();

    tour.on("complete", () => {
      setIsTourRunning(false);
      window.currentTour = null;
    });

    tour.on("cancel", () => {
      setIsTourRunning(false);
      window.currentTour = null;
    });
  };

  const handleSaveWithDisclaimer = async () => {
    confirmAlert({
      customUI: ({ onClose }) => {
        return (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Disclaimer
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please ensure you have the author’s permission before publishing
              or distributing the content.
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-zinc-600"
                onClick={onClose}>
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                onClick={async () => {
                  await handleUpdateSummary(content);
                  router.push("/");
                  onClose();
                  toast.success("Summary Saved!");
                }}>
                I Understand
              </button>
            </div>
          </div>
        );
      },
    });
  };

  const handleDeleteAuthor = () => {
    if (!name.trim()) {
      toast.warn("Author name cannot be empty.");
      return;
    }

    confirmAlert({
      customUI: ({ onClose }) => {
        return (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Confirm Deletion
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to remove the author{" "}
              <strong>&quot;{capitalizedName}&quot;</strong> from the database?
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-zinc-600"
                onClick={onClose}>
                No
              </button>
              <button
                className= "px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                onClick={async  () => {
                  await handleRemoveSumamry();
                  removeAuthorFromSessionStorage();
                  toast.success(`${capitalizedName} summary removed successfully!`);
                  onClose();
                }}
              >
                Only Summary
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                onClick={async () => {
                  await handleRemoveAuthor();
                  removeAuthorFromSessionStorage();
                  toast.success(`${capitalizedName} removed successfully!`);
                  onClose();
                }}>
                Yes, Entirely
              </button>
            </div>
          </div>
        );
      },
    });
  };

  const removeAuthorFromSessionStorage = () => {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("author_") && key.includes(name)) {
        sessionStorage.removeItem(key);
      }
    });

    const storedAuthors = JSON.parse(sessionStorage.getItem("authors") || "[]");
    const updatedAuthors = storedAuthors.filter((author) => author.Name !== name);
    sessionStorage.setItem("authors", JSON.stringify(updatedAuthors));
  };

  return (
    <div className="relative w-full min-h-screen">
      {isEdit && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md z-10 transition-opacity duration-500 ease-out ${
            isEdit ? "opacity-100" : "opacity-0"
          }`}></div>
      )}
      <div
        className={`relative z-0 flex flex-col w-full p-6 gap-4 transition-all duration-500 ease-out ${
          isEdit ? "z-20" : ""
        }`}>
        {/* Editor Button Outside */}
        <div className="flex justify-between items-center">
          {/* Back Button */}
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <Button
                onClick={async () => {
                  const cachedData = sessionStorage.getItem("cachedURL");
                  if (cachedData) {
                    router.push(cachedData);
                  } else {
                    console.warn("No cached URL found in sessionStorage");
                    router.back();
                  }
                }}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white hover:bg-gray-700 shadow-md hover:shadow-lg transition-all"
                title="Back"
            >
              <IoMdArrowBack size={20} />
            </Button>

            {/* Export Button */}
            <Button
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 text-white hover:bg-gray-700 shadow-md hover:shadow-lg transition-all"
              onClick={() => setIsExportModalOpen(true)}
              title="Export">
              <MdOutlineIosShare size={20} />
            </Button>

            {/* Export Modal */}
            {isExportModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-2xl p-6 max-w-sm w-full">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Export Options
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Ask the author&apos;s permission before publishing or
                    distributing the content.
                  </p>
                  <ul className="flex flex-col gap-2">
                    {["HTML", "Markdown"].map((format) => (
                      <li
                        key={format}
                        className="cursor-pointer p-2 rounded-md text-center bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-800 dark:text-white"
                        onClick={() => handleExport(format.toLowerCase())}>
                        Export as {format}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="mt-4 w-full p-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
                    onClick={() => setIsExportModalOpen(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Enter Editor Mode Button */}
          <div
            className={`flex justify-end ${
              isEdit ? "relative z-20 mb-4 -top-4" : ""
            }`}>
            {/* Cancel Button */}
            {isEdit && (
                <button
                    onClick={() => {
                      if (editor) {
                        editor.commands.setContent(summary);
                        setIsEdit(false);
                      }
                    }}
                    className={`px-3 py-3 -translate-y-48 translate-x-50 flex items-center text-white rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-300 ease-in-out`}
                    style={{
                      background: "linear-gradient(to right, #f87171, #ef4444)",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                    }}>
                  <IoMdClose className="mr-2" />
                  Discard Changes
                </button>
            )}
            <button
              onClick={toggleEdit}
              className={`px-3 py-3 flex items-center text-white rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-transform duration-300 ease-in-out ${
                isEdit ? "-translate-y-48 translate-x-6" : ""
              } ${isEdit ? "relative z-20" : ""}`}
              style={{
                background: "linear-gradient(to right, #4f46e5, #3b82f6)",
                fontSize: "0.9rem",
                fontWeight: "bold",
              }}>
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
        </div>

        {/* Summary Panel */}
        <div
          className={`editor-container bubble-menu-pen flex flex-col w-full lg:w-[100%] mx-auto bg-gray-100 dark:bg-zinc-800 rounded-lg shadow-md transition-all duration-500 ease-in-out ${
            isEdit
              ? "-translate-y-40 shadow-2xl transform scale-105 relative z-20"
              : ""
          }`}>
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col justify-center items-center min-h-[200px]">
                <div className="animate-spin h-8 w-8 border-4 border-gray-500 border-t-transparent rounded-full" />
                <p className="mt-4 text-gray-600 dark:text-white">
                  Regenerating...
                </p>
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
                        }}>
                        <div className="flex items-center justify-center p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105">
                          <button
                            className="flex items-center justify-center"
                            onClick={() => setIsPopupOpen(true)}
                            title="Improve it">
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
            {/* Regenerate Summary Button */}
            <div className="flex justify-center mt-6">
              {isEdit && (
              <div className="regenerate-summary p-2">
                <button
                    onClick={() => {
                      if (editor) {
                        const allText = editor.getText();
                        setSelectedText(allText);
                        setImprovementReason("");
                        setIsPopupOpen(true);
                      }
                    }}
                    className="px-6 py-3 text-white font-semibold bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg shadow-md hover:from-blue-600 hover:to-blue-800 transition-transform transform hover:scale-105">
                  Regenerate Summary
                </button>
              </div>
              )}
            </div>
          </div>
        </div>


        {/* Improvement Popup */}
        {isEdit && isPopupOpen && (
            <div className="improvement-popup popup right-8 md:w-[500px] bg-white p-4 rounded-lg shadow-lg fixed bottom-5 z-30 transition-all duration-500">
              <h3 className="font-bold mb-4 text-lg">Improve Text</h3>
              <div className="max-h-[100px] overflow-y-auto mb-3 p-2 bg-gray-200 rounded-md border-l-4 border-blue-500">
                {selectedText}
              </div>
              <textarea
                  className="w-full h-24 p-3 border rounded-md text-gray-900 dark:bg-zinc-800 dark:text-gray-200 focus:border-blue-500 resize-none"
                  placeholder="Enter your improvement"
                  value={improvementReason}
                  onChange={(e) => setImprovementReason(e.target.value)}
              />
              <div className="flex justify-end gap-4 mt-4">
                <button
                    className="bg-green-500 text-white px-4 py-2 rounded-md shadow hover:bg-green-600 transition-transform duration-300 ease-in-out flex items-center gap-1"
                    onClick={applyImprovement}>
                  ✓ Apply
                </button>
                <button
                    className="bg-gray-500 text-white px-4 py-2 rounded-md shadow hover:bg-gray-600 transition-transform duration-300 ease-in-out flex items-center gap-1"
                    onClick={() => {
                      setIsPopupOpen(false);
                      setImprovementPopupOpen(false);
                    }}>
                  ✕ Cancel
                </button>
              </div>
            </div>
        )}


        {/* Improvement Requests Timeline */}
        {isEdit && improvementRequests.length > 0 && (
          <div className="improvement-timeline fixed right-8 top-9 w-[600px] max-h-[58vh] p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md transition-all duration-500 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold border-b-2 border-blue-500">
                Improvement List
              </h3>
              <button
                className="regenerate-button bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 ease-in-out"
                onClick={handleRegenerate}>
                Regenerate
              </button>
            </div>
            <div className="overflow-y-auto max-h-[48vh] flex flex-col gap-4">
              {improvementRequests.map((request, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-zinc-700 rounded-lg shadow-sm border border-gray-200">
                  <div className="mb-2">
                    <p className="text-sm font-bold text-gray-800">
                      Selected Text:
                    </p>
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
                      className="text-blue-600 hover:text-blue-800 transition-colors">
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteRequest(index)}
                      className="text-red-600 hover:text-red-800 transition-colors">
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-4 justify-center p-2 mb-6">
        <Button
          className="bg-green-400 hover:bg-green-600"
          onClick={handleSaveWithDisclaimer}>
          <IoMdCheckmark size={30} />
        </Button>
        <Button
          className="bg-red-400 hover:bg-red-600"
          onClick={handleDeleteAuthor}>
          <IoMdClose size={30} />
        </Button>
      </div>
      <style jsx global>{`
        .shepherd-element {
          background: #ffffff;
          border-radius: 6px; 
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); 
          font-family: "Inter", sans-serif;
          color: #333;
          max-width: 320px; 
          border: 1px solid #e0e0e0;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .shepherd-has-cancel-icon .shepherd-cancel-icon {
          position: absolute;
          top: 10px;
          right: 10px;
          font-size: 16px;
          color: #555;
          cursor: pointer;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        .shepherd-has-cancel-icon .shepherd-cancel-icon:hover {
          color: #ff6b6b;
          transform: scale(1.1);
        }

        .shepherd-element .shepherd-content {
          padding: 14px 16px; 
          font-size: 13px; 
          line-height: 1.4;
          color: #444;
          text-align: center; 
        }

        .shepherd-footer {
          padding: 12px 16px; 
          display: flex;
          justify-content: center;
          gap: 10px; 
        }

        .shepherd-footer .shepherd-button {
          border-radius: 6px;
          padding: 6px 14px; 
          font-size: 13px; 
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: 0.2s ease;
        }
        .shepherd-footer .shepherd-button[data-shepherd-button-id="next"] {
          background: #2563eb;
          color: #ffffff;
          border: 1px solid #2563eb;
        }
        .shepherd-footer .shepherd-button[data-shepherd-button-id="next"]:hover {
          background: #1d4ed8;
        }

        .shepherd-footer .shepherd-button[data-shepherd-button-id="back"],
        .shepherd-footer .shepherd-button[data-shepherd-button-id="skip"] {
          background: #f9fafb;
          color: #555;
          border: 1px solid #d1d5db;
        }
        .shepherd-footer .shepherd-button[data-shepherd-button-id="back"]:hover,
        .shepherd-footer .shepherd-button[data-shepherd-button-id="skip"]:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .shepherd-footer .shepherd-button:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4); 
        }

        @media (max-width: 768px) {
          .shepherd-element {
            max-width: 90%;
            font-size: 12px; 
          }
          .shepherd-footer .shepherd-button {
            padding: 6px 10px; 
          }
        }
      `}</style>
    </div>
  );
};

export default Tiptap;
