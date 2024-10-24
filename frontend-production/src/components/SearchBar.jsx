import React from "react";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SearchBar = ({ setResults, counter, setCounter }) => {
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  // const API_URL = "https://jsonplaceholder.typicode.com/users";

  const handleSubmit = (e) => {
    e.preventDefault();
    setCounter(0);
    if (input.trim()) {
      navigate(`/result/${input}/${counter}`, {
        state: { searchQuery: input },
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };



  // const userData = (value) => {
  //   axios(API_URL)
  //     .then(res => {
  //       const result = res.data.filter(user => {
  //         return value && user && user.name && user.name.toLowerCase().includes(value);
  //       })
  //       setResults(result);
  //       console.log(result);
  //     })
  //     .catch(err => console.log(err));
  // }

  // const handleChange = (value) => {
  //   setInput(value);
  //   userData(value);
  // }
  const handleChange = (value) => {
    console.log(value);
    setInput(value);
  };
  return (
    <>
      <form className="w-full">
        <label
          htmlFor="default-search"
          className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
        >
          Search
        </label>
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 19l-4-4m0-7a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"
              />
            </svg>
          </div>
          <input
            type="search"
            id="default-search"
            className="block w-full pl-10 pr-4 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Search a scholar"
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            required
          />
          <button
            type="submit"
            className="ml-2 px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            onClick={handleSubmit}
          >
            Search
          </button>
        </div>
      </form>
    </>
  );
};

export default SearchBar;
