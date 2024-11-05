"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

interface PaginationControlProps {
  currentPage: number;
  maxPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

const PaginationControls: React.FC<PaginationControlProps> = ({
  currentPage,
  maxPages,
  hasNext,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    current.set("page", newPage.toString());
    router.push(`/results?${current.toString()}`);
    router.refresh();
  };

  return (
    <div className="mt-8 flex justify-center space-x-4">
      <button
        disabled={currentPage < 0}
        onClick={() => handlePageChange(currentPage - 1)}
        className={`px-4 py-2 rounded-md ${
          currentPage > 0
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }
        `}>
        Previous
      </button>
      <span className="px-4 py-2">
        Page {currentPage} of {maxPages}
      </span>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={!hasNext}
        className={`px-4 py-2 rounded-md ${
          hasNext
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        }`}>
        Next
      </button>
    </div>
  );
};

export default PaginationControls;
