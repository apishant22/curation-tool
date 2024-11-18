import React, { useState, useCallback, useRef } from "react";
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

const SelectableSummary: React.FC<SelectableSummaryProps> = ({
  content,
  onRegeneratePart,
}) => {
  const [selectedText, setSelectedText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [localContent, setLocalContent] = useState(content);

  const contentRef = useRef<HTMLDivElement>(null);

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

  const mockRegeneratePart = ({ selectedText: string }) => {
    const regeneratedText = selectedText.toUpperCase();
    return regeneratedText;
  };

  const handleRegenerate = async () => {
    try {
      const result = await mockRegeneratePart(selectedText);
      setLocalContent(
        (prevContent) =>
          prevContent.substring(0, selection.start) +
          result +
          prevContent.substring(selection.end)
      );
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error regenerating text:", error);
    }
  };

  const handleDelete = () => {
    setLocalContent(
      (prevContent) =>
        prevContent.substring(0, selection.start) +
        prevContent.substring(selection.end)
    );
    setIsDialogOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <div
          ref={contentRef}
          onMouseUp={handleSelection}
          className="p-6 prose max-w-none select-text cursor-text relative">
          <MarkdownContent content={localContent} />
        </div>
      </div>

      <AlertDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle></AlertDialogTitle>
          </AlertDialogHeader>

          <div className="mt-4">
            <p className="text-sm text-gray-500">Selected text:</p>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-zinc-800 rounded-md">
              <p className="text-sm">{selectedText}</p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={handleRegenerate}>
              Regenerate
            </AlertDialogAction>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SelectableSummary;
