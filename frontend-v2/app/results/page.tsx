"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PaginationControls from "@/components/results/PaginationControls";
import { MdOutlineWork } from "react-icons/md";
import toast from "react-hot-toast";
import Container from "@/components/global/Container";
import Search from "@/components/navbar/Search";

interface SearchResult {
  Name: string;
  Location?: string; // Only applicable for author results
  "Profile Link": string;
}

interface SearchResponse {
  results: SearchResult[];
  max_pages: number;
  no_next_page: boolean;
  no_previous_page: boolean;
  search_type: string;
}

function ResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSearchResults = async (
    searchTerm: string,
    page: number,
    category: string
  ) => {
    try {
      setLoading(true);

      const normalizedCategory =
        category.toLowerCase() === "author" ? "author" : "field";
      const url = `http://localhost:3002/search/${normalizedCategory}/${searchTerm}/${page}`;
      console.log(`Fetching: ${url}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      sessionStorage.setItem(
        `searchResults_${normalizedCategory}_${searchTerm}_${page}`,
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

  useEffect(() => {
    const searchTerm = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "0", 10);
    const category = searchParams.get("category") || "author";

    // Check for cached results
    const cachedData = sessionStorage.getItem(
      `searchResults_${category}_${searchTerm}_${page}`
    );
    if (cachedData) {
      setSearchData(JSON.parse(cachedData));
      setLoading(false);
    } else {
      fetchSearchResults(searchTerm, page, category)
        .then((data) => setSearchData(data))
        .catch((error) => {
          console.error("Search failed:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-gray-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!searchData || searchData.results.length === 0) {
    return (
      <Container>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-12"></div>
        <Container>
          <div className="p-6 pt-12 pb-6 flex flex-row justify-between">
            <div className="text-2xl mt-4 font-semibold text-gray-400">
              No Result Found
            </div>
            <div className="items-end">
              <Search />
            </div>
          </div>
        </Container>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"></div>
      </Container>
    );
  }

  const handleNameClick = (name: string, profileLink: string) => {
    const formattedName = name.trim().replace(/\s+/g, " ").toLowerCase();
    const profileIdMatch = profileLink.match(/profile\/(\d+)$/);
    const profileId = profileIdMatch ? profileIdMatch[1] : "";
    const searchParams = new URLSearchParams({
      name: formattedName,
      profileId: profileId,
    });

    toast.success(
      "Item has been successfully clicked! Redirecting to the details page."
    );

    router.push(`/summary?${searchParams.toString()}`);
  };

  return (
    <Suspense>
      <Container>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-12">
          <Container>
            <div className="pt-20 pb-6 flex flex-row justify-between">
              <div className="text-2xl mt-4 font-semibold text-gray-400">
                Search Results
              </div>
              <div className="items-end">
                <Search />
              </div>
            </div>
          </Container>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {searchData.results.map((result, index) => (
              <div
                key={index}
                className="p-6 border rounded-lg shadow-sm hover:shadow-md transition dark:bg-zinc-800">
                <div className="space-y-2">
                  <div>
                    <h2 className="text-xl font-semibold text-blue-600 dark:text-white hover:text-blue-800 dark:hover:text-neutral-500">
                      <p
                        className="cursor-pointer"
                        onClick={() =>
                          handleNameClick(result.Name, result["Profile Link"])
                        }>
                        {result.Name}
                      </p>
                    </h2>
                    {searchData.search_type === "author" && result.Location && (
                      <p className="text-gray-600 dark:text-neutral-400 flex gap-2 items-center">
                        <MdOutlineWork size={16} />
                        {result.Location}
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    <p className="flex items-center space-x-1">
                      <span className="font-medium">ACM DL:</span>
                      <a
                        href={result["Profile Link"]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600">
                        {result["Profile Link"]}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <PaginationControls
            currentPage={Number(searchParams.get("page") || "1")}
            hasNext={!searchData.no_next_page}
            hasPrevious={!searchData.no_previous_page}
          />
        </div>
      </Container>
    </Suspense>
  );
}

export default ResultsPage;
