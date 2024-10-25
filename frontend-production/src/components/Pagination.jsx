import React from "react";
import { useNavigate } from "react-router-dom";

const Pagination = ({ counter, setCounter, totalPages = 5, user }) => {
  // Convert counter to display page (0 -> 1, 1 -> 2, etc.)
  const navigate = useNavigate();
  const currentPage = counter + 1;

  const handlePageClick = (pageNumber) => {
    const newCounter = pageNumber - 1;
    setCounter(newCounter);
    navigate(`/result/${user}/${newCounter}`);
  };

  const handlePrevClick = () => {
    setCounter((prevCounter) => {
      if (prevCounter <= 0) {
        navigate(`/result/${user}/0`);
        return 0;
      }
      const newCounter = prevCounter - 1;
      navigate(`/result/${user}/${newCounter}`);
      return newCounter;
    });
  };

  const handleNextClick = () => {
    setCounter((prevCounter) => {
      const newCounter = prevCounter + 1;
      navigate(`/result/${user}/${newCounter}`);
      return newCounter;
    });
  };

  return (
    <div className="flex justify-center items-center gap-4 p-4">
      <button
        onClick={handlePrevClick}
        disabled={counter === 0}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
          ${
            counter === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
          }`}
      >
        Previous
      </button>

      <div className="flex gap-2">
        {[...Array(totalPages)].map((_, idx) => {
          const pageNumber = idx + 1;
          const isCurrentPage = pageNumber === currentPage;

          return (
            <button
              key={idx}
              onClick={() => handlePageClick(pageNumber)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors
                ${
                  isCurrentPage
                    ? "bg-blue-600 text-white font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
            >
              {pageNumber}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleNextClick}
        disabled={counter === totalPages - 1}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
          ${
            counter === totalPages - 1
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
