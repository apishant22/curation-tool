import React, { useState, useEffect } from "react";

const Pagination = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleRange, setVisibleRange] = useState([]);
  const totalPages = 10;
  const windowSize = 5;

  useEffect(() => {
    calculateVisibleRange();
  }, [currentPage]);

  const calculateVisibleRange = () => {
    let start = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let end = start + windowSize - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - windowSize + 1);
    }

    setVisibleRange(
      Array.from({ length: end - start + 1 }, (_, i) => start + i)
    );
  };

  const handlePrevClick = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextClick = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex justify-center items-center gap-4 p-4 w-full max-w-[28rem]">
      <button
        onClick={handlePrevClick}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
          ${
            currentPage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
          }`}
      >
        Previous
      </button>

      <div className="flex gap-2 relative h-10 overflow-hidden">
        <div className="flex gap-2 transition-transform duration-200 ease-in-out">
          {visibleRange.map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => handlePageClick(pageNumber)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200
                ${
                  pageNumber === currentPage
                    ? "bg-blue-600 text-white font-medium scale-105"
                    : "text-gray-600 hover:bg-gray-100"
                }
              `}
            >
              <span className="transform transition-all duration-300">
                {pageNumber}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleNextClick}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
          ${
            currentPage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
          }`}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
