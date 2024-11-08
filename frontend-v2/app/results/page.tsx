"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PaginationControls from "@/components/results/PaginationControls";
import { MdOutlineWork } from "react-icons/md";
import toast from "react-hot-toast";
import Container from "@/components/global/Container";

interface Author {
  Location: string;
  Name: string;
  "Orcid ID": string;
  "Profile Link": string;
}

interface SearchResponse {
  authors: Author[];
  max_pages: number;
  no_next_page: boolean;
  no_previous_page: boolean;
}

function ResultsPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);

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

      // Cache the fetched data in sessionStorage
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

  useEffect(() => {
    // Combine pathname and search params without the origin
    const currentUrl = `${pathname}?${searchParams.toString()}`;

    // Store the relative URL in sessionStorage
    sessionStorage.setItem("currentPagePath", currentUrl);
  }, [pathname, searchParams]);

  useEffect(() => {
    const searchTerm = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "0", 10);
    // Store URL in cached session storage

    // Check for cached results
    const cachedData = sessionStorage.getItem(
      `searchResults_${searchTerm}_${page}`
    );
    if (cachedData) {
      setSearchData(JSON.parse(cachedData));
      setLoading(false);
    } else {
      setLoading(true);
      fetchSearchResults(searchTerm, page)
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

  if (!searchData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No results found</p>
      </div>
    );
  }

  const handleNameClick = (
    name: string,
    orcidId: string,
    profileLink: string
  ) => {
    const formattedName = name.trim().replace(/\s+/g, " ").toLowerCase();
    // Extract the ID number after "profile/"
    const profileIdMatch = profileLink.match(/profile\/(\d+)$/);
    const profileId = profileIdMatch ? profileIdMatch[1] : "";

    const searchParams = new URLSearchParams({
      name: formattedName,
      orcid: orcidId,
      profileId: profileId,
    });

    toast.success(
      "Author has been successfully clicked! Redirecting to the summary page."
    );

    router.push(`/summary?${searchParams.toString()}`);
  };

  return (
    <Container>
      <div className="pmax-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-12">
        <h1 className="text-3xl font-bold mb-6">Search Results</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {searchData.authors.map((author, index) => (
            <div
              key={index}
              className="p-6 border rounded-lg shadow-sm hover:shadow-md transition bg-white">
              <div className="space-y-2">
                <div>
                  <h2 className="text-xl font-semibold text-blue-600 hover:text-blue-800">
                    <p
                      className="cursor-pointer"
                      onClick={() =>
                        handleNameClick(
                          author.Name,
                          author["Orcid ID"],
                          author["Profile Link"]
                        )
                      }>
                      {author.Name}
                    </p>
                  </h2>
                  <p className="text-gray-600 flex gap-2 items-center">
                    <MdOutlineWork size={16} />
                    {author.Location}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  <p className="flex items-center space-x-1">
                    <span className="font-medium">ACM DL:</span>
                    <a
                      href={`${author["Profile Link"]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600">
                      {author["Profile Link"]}
                    </a>
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  <p className="flex items-center space-x-2">
                    <span className="font-medium">ORCID:</span>
                    <a
                      href={`https://orcid.org/${author["Orcid ID"]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600">
                      {author["Orcid ID"]}
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
