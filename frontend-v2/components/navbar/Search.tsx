"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef} from "react"
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
  const [placeholder, setPlaceholder] = useState("Search");
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent<HTMLInputElement>) => {
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
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) =>{
      if(dropdownRef.current && !dropdownRef.current.contains(e.target as Node)){
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown",handleClickOutside);
    return () => {
      document.removeEventListener("mousedown",handleClickOutside);
    };
  },[]);

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
    setIsOpen(false);
  };

  return (
    <div className=" flex w-full cursor-pointer items-center justify-between border-[1px] p-1 shadow-sm transition md:max-w-[1200px] md:min-w-[600px] dark:bg-zinc-800 rounded-lg">
      <div className="pl-2 text-sm">
        <div ref={dropdownRef} className="relative">
          <div
            className="flex items-center dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-950 transition duration-100 rounded-lg"
            onClick={toggleOpen}>
            <div className="p-1">{category}</div>
            <div>
              <TbCaretDownFilled />
            </div>
          </div>
          {isOpen && (
            <div
              className={`absolute bg-white dark:bg-zinc-900 top-10 w-40 border-[1px] shadow-lg rounded-lg`}>
              <div
                className="p-1"
                onClick={() =>
                  handleCategoryClick("Author", "Search author ...")
                }>
                <div className="flex items-center p-1 transition duration-200 bg-white hover:bg-zinc-100 dark:hover:bg-zinc-950 rounded-lg">
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
                    "Search research field ..."
                  )
                }>
                <div className="flex items-center p-1 transition duration-200 bg-white hover:bg-zinc-100 dark:hover:bg-zinc-950 rounded-lg">
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
        className="ml-2 flex-1 font-sans text-xs outline-none md:text-base border-none focus:ring-0"
        type="search"
        placeholder={placeholder}
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        required
      />
      <button
        onClick={(e) => handleSubmit(e)}
        disabled={loading}
        className="pr-2 flex items-center justify-center hover:text-blue-500">
        {loading ? (
          <div className="animate-spin h-5 w-5 border-2 border-gray-500" />
        ) : (
          <BiSearch size={25} />
        )}
      </button>
    </div>
  );
};

export default Search;
