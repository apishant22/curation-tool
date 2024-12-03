"use client";

import React, { useState, useEffect } from "react";
import ClientOnly from "@/components/global/ClientOnly";
import Container from "@/components/global/Container";
import HomeLogo from "@/components/global/HomeLogo";
import Search from "@/components/navbar/Search";
import AuthorNetwork from "@/components/modal/Network";
import ContentCard from "@/components/homepage/ContentCard";
import { MdOutlineInsights } from "react-icons/md";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { fetchRecommendations } from "@/utils/fetchRecommendations";
import SummaryCard from "@/components/homepage/SummaryCard";

const getStoredAuthors = () => {
  const storedAuthors = sessionStorage.getItem("authors");
  return storedAuthors ? JSON.parse(storedAuthors) : [];
};

const setStoredRecommendations = (cacheKey: string, recommendations: any) => {
  sessionStorage.setItem(cacheKey, JSON.stringify(recommendations));
};

const getStoredRecommendations = (cacheKey: string) => {
  const cachedData = sessionStorage.getItem(cacheKey);
  return cachedData ? JSON.parse(cachedData) : null;
};

// Homepage Component
const Homepage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [recentAuthors, setRecentAuthors] = useState<any[]>([]);
  const [recentIndex, setRecentIndex] = useState<number>(0);
  const maxRecommendations = 6;
  const maxResultsPerField = 6;

  const loadRecommendations = async () => {
    const authors = getStoredAuthors();
    console.log("Authors in sessionStorage:", authors);

    const cacheKey = `recommendations_${JSON.stringify(
        authors
    )}_${maxRecommendations}_${maxResultsPerField}`;
    const cachedData = getStoredRecommendations(cacheKey);

    if (cachedData) {
      console.log("Using cached recommendations.");
      setData(cachedData);
    } else {
      console.log("Fetching fresh recommendations...");
      try {
        const recommendations = await fetchRecommendations(
            authors,
            maxRecommendations,
            maxResultsPerField
        );
        if (recommendations) {
          console.log("Fetched recommendations:", recommendations);
          if (
              recommendations["Recommended Authors"] &&
              recommendations["Authors by Weighted Fields"]
          ) {
            setData(recommendations);
            setStoredRecommendations(cacheKey, recommendations);
          } else {
            console.warn("Unexpected data structure:", recommendations);
          }
        } else {
          console.warn("No recommendations fetched. Empty list may have been passed.");
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      }
    }
  };


  const loadRecentAuthors = async () => {
    try {
      const response = await fetch(
        "http://localhost:3002/authors_with_summaries?limit=6"
      );
      if (response.ok) {
        const authors = await response.json();
        const processedAuthors = authors.map((author) => ({
          ...author,
          Summary: author.Summary || "No summary available.",
        }));
        console.log("Fetched recent authors:", processedAuthors);
        setRecentAuthors(processedAuthors);
      } else {
        console.warn("Failed to fetch recent authors.");
      }
    } catch (error) {
      console.error("Error fetching recent authors:", error);
    }
  };

  // Trigger recommendations and recent authors load on mount
  useEffect(() => {
    console.log(
      "Homepage mounted. Checking sessionStorage for recommendations..."
    );
    const cachedRecommendations = sessionStorage.getItem("recommendations");
    if (cachedRecommendations) {
      setData(JSON.parse(cachedRecommendations));
    } else {
      loadRecommendations(); // Fetch recommendations if not in sessionStorage
    }
    loadRecentAuthors(); // Fetch recent authors
  }, []);

  const [currentIndex, setCurrentIndex] = useState<number[]>([]);

  useEffect(() => {
    if (data) {
      const indices = [
        ...(data["Recommended Authors"]?.map(() => 0) || []),
        ...(data["Authors by Weighted Fields"]?.map(() => 0) || []),
      ];
      setCurrentIndex(indices);
    }
  }, [data]);

  const handlePrev = (sectionIndex: number) => {
    setCurrentIndex((prev) =>
      prev.map((index, i) =>
        i === sectionIndex ? Math.max(0, index - 1) : index
      )
    );
  };

  const handleNext = (sectionIndex: number, length: number) => {
    setCurrentIndex((prev) =>
      prev.map((index, i) =>
        i === sectionIndex
          ? Math.min(index + 1, Math.ceil(length / 3) - 1)
          : index
      )
    );
  };

  return (
    <div className="pt-36 flex justify-center items-center">
      <ClientOnly>
        <Container>
          {/* Header */}
          <div className="border-b-[1px] flex flex-col items-center gap-10">
            <div className="pt-10 pb-10">
              <HomeLogo />
            </div>
            <div className="pl-5 pr-5">
            <Search />
            </div>
            <div className="text-neutral-400 text-sm flex gap-2 pb-10">
              <span>
                <MdOutlineInsights size={20} />
              </span>
              Supporting, celebrating and advocating for women in computing
            </div>
          </div>

          <Container>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20 p-20 gap-10">
          <div className="flex flex-row gap-8 justify-between items-start">
            {/* Content: AuthorNetwork */}
            <div className="text-left">
              <h2 className="text-xl font-bold mb-5 ">
                Author Collaboration Network
              </h2>
              <div className="flex-1">
                <AuthorNetwork />
              </div>
            </div>
            {/* Content: Recommend cards*/}
            <div className="text-left">
                <h2 className="text-xl font-bold mb-5">Other Elements</h2>
              <div className="flex-1 min-w-[600px] bg-gray-50 rounded-lg p-6">
                {/* Recently Searched */}
          {recentAuthors.length > 0 && (
            <div className="w-full group relative pt-12">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Community Searches
              </h2>
              <div className="relative">
                {/* Left Arrow */}
                {recentIndex > 0 && (
                  <button
                    onClick={() =>
                      setRecentIndex((prev) => Math.max(0, prev - 1))
                    }
                    className="absolute left-[-50px] top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full shadow-md transition-opacity duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 z-10">
                    <IoIosArrowBack size={20} />
                  </button>
                )}

                {/* Carousel */}
                <div className="overflow-hidden relative">
                  <div
                    className="flex transition-transform duration-500"
                    style={{
                      transform: `translateX(-${recentIndex * 100}%)`,
                    }}>
                    {recentAuthors.map((author, index) => (
                      <div
                        key={index}
                        className={`min-w-[33.3%] flex-shrink-0 p-2`}>
                        <SummaryCard
                          name={author.Name}
                          profileLink={author["Profile Link"]}
                          summary={author.Summary || "No summary available."}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Arrow */}
                {recentIndex < Math.ceil(recentAuthors.length / 3) - 1 && (
                  <button
                    onClick={() =>
                      setRecentIndex((prev) =>
                        Math.min(
                          prev + 1,
                          Math.ceil(recentAuthors.length / 3) - 1
                        )
                      )
                    }
                    className="absolute right-[-50px] top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full shadow-md transition-opacity duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 z-10">
                    <IoIosArrowForward size={20} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="flex flex-col gap-10 items-center justify-center pt-12 pb-12">
            {data ? (
                <>
                  {[
                    ...(data["Recommended Authors"] || []),
                    ...(data["Authors by Weighted Fields"] || []),
                  ]
                      .filter((recommendation) => recommendation.Authors?.length > 0)
                      .map((recommendation, sectionIndex) => (
                          <div key={sectionIndex} className="w-full group relative">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                              {recommendation.Subheading}
                            </h2>
                            <div className="relative">
                              {currentIndex[sectionIndex] > 0 && (
                                  <button
                                      onClick={() => handlePrev(sectionIndex)}
                                      className="absolute left-[-50px] top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full shadow-md transition-opacity duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 z-10"
                                  >
                                    <IoIosArrowBack size={20} />
                                  </button>
                              )}

                              <div className="overflow-hidden relative">
                                <div
                                    className="flex transition-transform duration-500"
                                    style={{
                                      transform: `translateX(-${currentIndex[sectionIndex] * 100}%)`,
                                    }}
                                >
                                  {recommendation.Authors.map((author: { [x: string]: any; Name: any; Summary: any; Reason: any; }, authorIndex: React.Key | null | undefined) => (
                                      <div
                                          key={authorIndex}
                                          className={`min-w-[33.3%] flex-shrink-0 p-2`}
                                      >
                                        <ContentCard
                                            name={author.Name || author["Recommended Author"]}
                                            profileLink={author["Profile Link"]}
                                            summary={author.Summary || ""}
                                            reason={author.Reason || "No reason provided."}
                                        />
                                      </div>
                                  ))}
                                </div>
                              </div>

                              {currentIndex[sectionIndex] <
                                  Math.ceil(recommendation.Authors.length / 3) - 1 && (
                                      <button
                                          onClick={() =>
                                              handleNext(sectionIndex, recommendation.Authors.length)
                                          }
                                          className="absolute right-[-50px] top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full shadow-md transition-opacity duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 z-10"
                                      >
                                        <IoIosArrowForward size={20} />
                                      </button>
                                  )}
                            </div>
                          </div>
                      ))}
                </>
            ) : (
                <div className="flex items-center justify-center h-20 space-x-2">
                  <div className="w-5 h-5 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600 dark:text-neutral-400 text-lg">
                         Loading recommendations
                  </span>
                </div>
            )}
          </div>;
              </div>
              </div>
            </div>
          </div>
        </Container>
        </Container>
      </ClientOnly>
    </div>
  );
};

export default Homepage;
