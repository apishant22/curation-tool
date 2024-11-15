"use client";
import React, { useEffect, useState } from "react";
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

      const normalizedCategory = category.toLowerCase() === "author" ? "author" : "field";
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
        <div className="text-center py-12">
          <p className="text-gray-500">No results found</p>
        </div>
    );
  }

  const handleNameClick = (name: string, profileLink: string) => {
    toast.success(
        "Item has been successfully clicked! Redirecting to the details page."
    );

    router.push(`/details?name=${name}&profile=${profileLink}`);
  };

  return (
      <Container>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-12">
          <Container>
            <div className="pt-12 pb-6 flex flex-row justify-between">
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
                    className="p-6 border rounded-lg shadow-sm hover:shadow-md transition bg-white"
                >
                  <div className="space-y-2">
                    <div>
                      <h2 className="text-xl font-semibold text-blue-600 hover:text-blue-800">
                        <p
                            className="cursor-pointer"
                            onClick={() =>
                                handleNameClick(result.Name, result["Profile Link"])
                            }
                        >
                          {result.Name}
                        </p>
                      </h2>
                      {searchData.search_type === "author" && (
                          <p className="text-gray-600 flex gap-2 items-center">
                            <MdOutlineWork size={16} />
                            {result.Location || "Unknown location"}
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
                            className="hover:text-blue-600"
                        >
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
              maxPages={searchData.max_pages}
              hasNext={!searchData.no_next_page}
              hasPrevious={!searchData.no_previous_page}
          />
        </div>
      </Container>
  );
}

export default ResultsPage;

