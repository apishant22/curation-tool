"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useState } from "react";
import { BiSearch } from "react-icons/bi";
import { FaUserGraduate } from "react-icons/fa";
import { IoBookSharp } from "react-icons/io5";
import { TbCaretDownFilled } from "react-icons/tb";

const categoryMapping: { [key: string]: string } = {
  Author: "author",
  "Research Field": "field",
};

const Search = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [counter] = useState(0);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState("Author");
  const [placeholder, setPlaceholder] = useState("Search any scholar!");

  // get the value from the search bar
  // fetch data from API using the value
  // it will loads
  // after it is done, go to the results page
  // the api is /search
  // to use the api, need to give /search/{name}/{counter (referring to the page number, initially at 0)}
  // after fetching the data, navigate to the results page and pass the data to them

  const fetchSearchResults = async (
    searchTerm: string,
    page: number,
    category: string
  ) => {
    try {
      setLoading(true);

      const categoryPath = categoryMapping[category] || "author"; // Map display name to API value
      const url = `http://localhost:3002/search/${categoryPath}/${searchTerm}/${page}`;
      console.log(`Fetching: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        console.error("API Response Error:", response.statusText);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched Data:", data);

      sessionStorage.setItem(
        `searchResults_${categoryPath}_${searchTerm}_${page}`,
        JSON.stringify(data)
      );

      return data;
    } catch (error) {
      console.error("Search failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (!input.trim()) {
      return;
    }

    try {
      const searchResults = await fetchSearchResults(input, counter, category);
      sessionStorage.setItem("searchResults", JSON.stringify(searchResults));
      const searchParams = new URLSearchParams({
        query: input,
        page: counter.toString(),
        category: categoryMapping[category], // Map display name to API value here too
      });
      router.push(`/results?${searchParams.toString()}`);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const handleChange = (value: string) => {
    setInput(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key == "Enter") {
      handleSubmit(e);
    }
  };

  const toggleOpen = useCallback(() => {
    setIsOpen((value) => !value);
  }, []);

  const handleCategoryClick = (
    categoryName: string,
    placeholderName: string
  ) => {
    toggleOpen();
    setCategory(categoryName); // Use the display name here
    setPlaceholder(placeholderName);
  };

  return (
    <div className=" flex w-full cursor-pointer items-center justify-between rounded-full border-[1px] p-1 shadow-sm transition hover:shadow-md md:max-w-[1200px] md:min-w-[600px] dark:bg-zinc-800">
      <div className="pl-2 text-sm">
        <div className="relative">
          <div
            className="flex items-center rounded-md border dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-950 transition duration-100"
            onClick={toggleOpen}>
            <div className="p-1">{category}</div>
            <div>
              <TbCaretDownFilled />
            </div>
          </div>
          {isOpen && (
            <div
              className={`absolute left-0 dark:bg-zinc-900 top-9 w-40 border-[1px] shadow-lg rounded-md`}>
              <div
                className="p-1"
                onClick={() =>
                  handleCategoryClick("Author", "Search any scholar!")
                }>
                <div className="flex items-center p-1 transition duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-950 rounded-md">
                  <div className="p-1">
                    <FaUserGraduate />
                  </div>
                  <div className="pl-1 flex-grow">Author</div>
                </div>
              </div>
              <hr />
              <div
                className="p-1"
                onClick={() =>
                  handleCategoryClick(
                    "Research Field", // Displayed as "Research Field"
                    "Search any research fields!"
                  )
                }>
                <div className="flex items-center p-1 transition duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-950 rounded-md">
                  <div className="p-1">
                    <IoBookSharp />
                  </div>
                  <div className="pl-1 flex-grow">Research Field</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <input
        className="ml-2 flex-1 bg-transparent font-sans text-xs outline-none md:text-base border-none focus:ring-0"
        type="search"
        placeholder={placeholder}
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        required
      />
      <button
        onClick={() => handleSubmit}
        disabled={loading}
        className="flex items-center justify-center">
        {loading ? (
          <div className="animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full" />
        ) : (
          <BiSearch size={18} />
        )}
      </button>
    </div>
  );
};

export default Search;
