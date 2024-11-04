"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { BiSearch } from "react-icons/bi";

const Search = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [counter] = useState(0);
  const router = useRouter();

  // get the value from the search bar
  // fetch data from API using the value
  // it will loads
  // after it is done, go to the results page
  // the api is /search
  // to use the api, need to give /search/{name}/{counter (referring to the page number, initially at 0)}
  // after fetching the data, navigate to the results page and pass the data to them

  const fetchSearchResults = async (searchTerm: string, page: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3002/search/${searchTerm}/${page}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      sessionStorage.setItem(
        `searchResults_${searchTerm}_${page}`,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      return;
    }

    try {
      const searchResults = await fetchSearchResults(input, counter);
      sessionStorage.setItem(`searchResults`, JSON.stringify(searchResults));
      const searchParams = new URLSearchParams({
        query: input,
        page: counter.toString(),
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

  return (
    <div className="flex w-full cursor-pointer items-center justify-between rounded-full border-[1px] p-2 shadow-sm transition hover:shadow-md md:max-w-[1200px] md:min-w-[600px]">
      <input
        className="ml-2 flex-1 bg-transparent font-sans text-xs outline-none md:text-base border-none focus:ring-0"
        type="search"
        placeholder="Search any researchers!"
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        required
      />
      <button
        onClick={handleSubmit}
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
