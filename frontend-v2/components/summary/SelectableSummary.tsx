"use client";
import React, { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MarkdownContent from "./MarkdownContent";

interface SelectableSummaryProps {
  content: string;
  onRegeneratePart: (
    selectedText: string,
    start: number,
    end: number
  ) => Promise<void>;
}

// Mock regeneration function for testing
const mockRegeneratePart = async (
  selectedText: string,
  start: number,
  end: number
) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock regenerated text - you can modify this to test different scenarios
  const mockNewText = `${selectedText.toUpperCase()}`;
  return { regeneratedText: mockNewText };
};

const SelectableSummary: React.FC<SelectableSummaryProps> = ({
  content,
  onRegeneratePart,
}) => {
  const [selectedText, setSelectedText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [localContent, setLocalContent] = useState(content); // Add local state for content

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString());
      const selectedStr = selection.toString();
      const startIndex = localContent.indexOf(selectedStr);
      const endIndex = startIndex + selectedStr.length;
      setSelection({ start: startIndex, end: endIndex });
      setIsDialogOpen(true);
    }
  }, [localContent]);

  const handleRegenerate = async () => {
    try {
      // Use mock function instead of actual API call
      const result = await mockRegeneratePart(
        selectedText,
        selection.start,
        selection.end
      );

      // Update local content with the mock regenerated text
      setLocalContent(
        (prevContent) =>
          prevContent.substring(0, selection.start) +
          result.regeneratedText +
          prevContent.substring(selection.end)
      );

      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error regenerating text:", error);
    }
  };

  return (
    <div className="relative">
      <div
        onMouseUp={handleSelection}
        className="p-6 prose max-w-none select-text cursor-text">
        <MarkdownContent content={localContent} />
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Selected Text</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Selected text:</p>
            <div className="mt-2 p-3 bg-gray-100 rounded-md">
              <p className="text-sm">{selectedText}</p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate}>
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SelectableSummary;
