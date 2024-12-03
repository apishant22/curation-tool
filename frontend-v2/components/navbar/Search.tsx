"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
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
  const [placeholder, setPlaceholder] = useState("Search an author ...");
  const [gender, setGender] = useState(false);
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
      const url = `http://localhost:3002/search/${categoryPath}/${searchTerm}/${page}/${gender}`;
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

  const handleSubmit = async (
    e: React.FormEvent | React.KeyboardEvent<HTMLInputElement>
  ) => {
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
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const handleGenderClick = () => {
    setGender((value: any) => !value);
  };

  return (
    <div className=" relative flex w-full cursor-pointer items-center justify-between border-[1px] p-1 shadow-sm transition md:max-w-[1200px] md:min-w-[600px] dark:bg-zinc-800 rounded-lg">
      <div className="pl-2 text-sm">
        <div ref={dropdownRef} className="relative">
          <div
            className="flex items-center dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition duration-100 rounded-lg"
            onClick={toggleOpen}>
            <div className="p-1">{category}</div>
            <div>
              <TbCaretDownFilled />
            </div>
          </div>
          {isOpen && (
            <div
              className={`absolute bg-white dark:bg-zinc-800 top-10 w-40 border-[1px] shadow-lg rounded-lg`}>
              <div
                className="p-1"
                onClick={() =>
                  handleCategoryClick("Author", "Search author ...")
                }>
                <div className="flex items-center p-1 transition duration-200 bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-900 rounded-lg">
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
                <div className="flex items-center p-1 transition duration-200 bg-white hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-900 rounded-lg">
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
        id="search"
        className=" ml-2 flex-1 font-sans text-xs outline-none md:text-base border-none focus:ring-0 dark:bg-zinc-800"
        type="search"
        placeholder={placeholder}
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        required
      />
      <div className="pr-3">
        <div
          className={` p-2 rounded-lg text-sm cursor-pointer border-[1px] transition duration-300 hover:text-neutral-600 dark:border-zinc-600 dark:hover:text-zinc-400 ${
            gender ? "bg-blue-300 dark:bg-zinc-900" : ""
          }`}
          onClick={handleGenderClick}>
          Woman Only
        </div>
      </div>
      <button
        onClick={(e) => handleSubmit(e)}
        disabled={loading}
        className="pr-2 flex items-center justify-center hover:text-blue-500">
        {loading ? (
          <div className="grid w-full place-items-center overflow-x-scroll rounded-lg lg:overflow-visible">
            <svg
              className="text-gray-300 animate-spin"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24">
              <path
                d="M32 3C35.8083 3 39.5794 3.75011 43.0978 5.20749C46.6163 6.66488 49.8132 8.80101 52.5061 11.4939C55.199 14.1868 57.3351 17.3837 58.7925 20.9022C60.2499 24.4206 61 28.1917 61 32C61 35.8083 60.2499 39.5794 58.7925 43.0978C57.3351 46.6163 55.199 49.8132 52.5061 52.5061C49.8132 55.199 46.6163 57.3351 43.0978 58.7925C39.5794 60.2499 35.8083 61 32 61C28.1917 61 24.4206 60.2499 20.9022 58.7925C17.3837 57.3351 14.1868 55.199 11.4939 52.5061C8.801 49.8132 6.66487 46.6163 5.20749 43.0978C3.7501 39.5794 3 35.8083 3 32C3 28.1917 3.75011 24.4206 5.2075 20.9022C6.66489 17.3837 8.80101 14.1868 11.4939 11.4939C14.1868 8.80099 17.3838 6.66487 20.9022 5.20749C24.4206 3.7501 28.1917 3 32 3L32 3Z"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"></path>
              <path
                d="M32 3C36.5778 3 41.0906 4.08374 45.1692 6.16256C49.2477 8.24138 52.7762 11.2562 55.466 14.9605C58.1558 18.6647 59.9304 22.9531 60.6448 27.4748C61.3591 31.9965 60.9928 36.6232 59.5759 40.9762"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-900 dark:text-white"></path>
            </svg>
          </div>
        ) : (
          <BiSearch size={25} />
        )}
      </button>
    </div>
  );
};

export default Search;
function setGender(arg0: (value: any) => boolean) {
  throw new Error("Function not implemented.");
}

