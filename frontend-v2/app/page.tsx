"use client";

import React, { useState, useEffect } from "react";
import ClientOnly from "@/components/global/ClientOnly";
import Container from "@/components/global/Container";
import HomeLogo from "@/components/global/HomeLogo";
import Search from "@/components/navbar/Search";
import ContentCard from "@/components/homepage/ContentCard";
import AuthorNetwork from "@/components/modal/Network";
import { MdOutlineInsights } from "react-icons/md";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { fetchRecommendations } from "@/utils/fetchRecommendations";
import SpotlightCard from "@/components/homepage/SpotlightCard";

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
  const [presentedAuthor, setPresentedAuthor] = useState<string | null>(null);
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
        if (processedAuthors.length > 0) {
          setPresentedAuthor(processedAuthors[0].Name);
        }
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
    setPresentedAuthor(() =>
        recentAuthors[recentIndex]?.Name || "");
  }, [recentIndex, recentAuthors]);

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
      <div className="pt-36 pb-18 flex justify-center items-center">
        <ClientOnly>
          <Container>
            {/* Header */}
            <div className="border-b-[1px] flex flex-col items-center gap-10">
              <div className="pt-4 pb-4">
                <HomeLogo/>
              </div>
              <div className="pl-5 pr-5">
                <Search/>
              </div>
              <div className="text-neutral-400 text-sm flex gap-2 pb-10">
              <span>
                <MdOutlineInsights size={20} />
              </span>
                Supporting, celebrating and advocating for women in computing
              </div>
            </div>

            <Container>
              {/* Content: SpotlightCard + AuthorNetwork */}
              <div className="flex flex-row gap-8 justify-between items-start pb-10 w-full group relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pt-12">
                <div className="text-left max-w-[395px]">
                  <h2 className="text-xl font-bold mb-5 ">
                    Spotlight
                  </h2>
                  <div className="flex-1 rounded-lg">
                    <div className="text-neutral-600 dark:text-neutral-400">
                      {/* Recently Searched */}
                      {recentAuthors.length > 0 && (
                            <div className="relative">
                              {/* Left Arrow */}
                              {recentIndex > 0 && (
                                  <button
                                      onClick={() => {
                                          setRecentIndex((prev) => Math.max(0, prev - 1));
                                        }
                                      }
                                      className="absolute left-[-50px] top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full shadow-md transition-opacity duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 z-10">
                                    <IoIosArrowBack size={20} />
                                  </button>
                              )}

                              {/* Carousel */}
                              <div className="overflow-hidden relative">
                                <div
                                    className="flex flex-row transition-transform duration-1000"
                                    style={{
                                      transform: `translateX(-${recentIndex * 100}%)`,
                                    }}>

                                  {recentAuthors.map((author, index) => (
                                      <div
                                          key={index}
                                          className={`min-w-[20%] flex-shrink-0 p-2`}>
                                        <SpotlightCard
                                            name={author.Name}
                                            profileLink={author["Profile Link"]}
                                            summary={author.Summary || "No summary available."}
                                        />
                                      </div>
                                  ))}
                                </div>
                              </div>

                              {/* Right Arrow */}
                              {recentIndex < recentAuthors.length - 1 && (
                                  <button
                                      onClick={() => {
                                          setRecentIndex((prev) => Math.min(prev + 1, recentAuthors.length - 1));
                                        }
                                      }
                                      className="absolute right-[-50px] top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full shadow-md transition-opacity duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 z-10">
                                    <IoIosArrowForward size={20} />
                                  </button>
                              )}

                              {/* Dot Navigation */}
                              <div className="flex justify-center mt-4 space-x-2">
                                {recentAuthors.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setRecentIndex(index)}
                                        className={`h-2 w-2 rounded-full transition-all ${
                                            index === recentIndex ? 'bg-gray-600 scale-75' : 'bg-gray-200'
                                        }`}
                                    />
                                ))}
                              </div>
                          </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 text-center item-end">
                  <div className="max-w-4xl max-h-[400px]">
                    <div className="flex-1">
                      <AuthorNetwork
                          authorName={presentedAuthor || ""}
                          width={800}
                          height={400}
                      />
                    </div>
                  </div>
                  <h4 className="font-bold mb-5 text-gray-400 pt-2">
                    Collaboration Network
                  </h4>
                </div>

              </div>
            </Container>

            {/* Recommendations */}
            <div className="border-t-[1px] pt-8 pb-18 flex flex-col items-center justify-center">
              {data ? (
                  <>
                    {[
                      ...(data["Recommended Authors"] || []),
                      ...(data["Authors by Weighted Fields"] || []),
                    ]
                        .filter((recommendation) => recommendation.Authors?.length > 0)
                        .map((recommendation, sectionIndex) => (
                            <div key={sectionIndex} className="w-full group relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                                {recommendation.Subheading}
                              </h2>
                              <div className="relative">
                                {currentIndex[sectionIndex] > 0 && (
                                    <button
                                        onClick={() => handlePrev(sectionIndex)}
                                        className="absolute left-[-50px] top-1/2 transform -translate-y-1/2 bg-gray-800 text-white p-2 rounded-full shadow-md transition-opacity duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 z-10"
                                    >
                                      <IoIosArrowBack size={20}/>
                                    </button>
                                )}

                                <div className="overflow-hidden relative">
                                  <div
                                      className="flex transition-transform duration-1000"
                                      style={{
                                        transform: `translateX(-${currentIndex[sectionIndex] * 100}%)`,
                                      }}
                                  >
                                    {recommendation.Authors.map((author: {
                                      [x: string]: string;
                                      Name: any;
                                      Summary: any;
                                      Reason: any;
                                    }, authorIndex: React.Key | null | undefined) => (
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
                                          <IoIosArrowForward size={20}/>
                                        </button>
                                    )}
                                {/* Dot Navigation */}
                                <div className="flex justify-center mt-4 space-x-2">
                                  {Array.from(
                                      {length: Math.ceil(recommendation.Authors.length / 3)},
                                      (_, dotIndex) => (
                                          <button
                                              key={dotIndex}
                                              onClick={() =>
                                                  setCurrentIndex((prev) =>
                                                      prev.map((index, i) =>
                                                          i === sectionIndex ? dotIndex : index
                                                      )
                                                  )
                                              }
                                              className={`h-2 w-2 rounded-full transition-all ${
                                                  dotIndex === currentIndex[sectionIndex]
                                                      ? "bg-gray-600 scale-75"
                                                      : "bg-gray-200"
                                              }`}
                                          />
                                      )
                                  )}
                                </div>
                              </div>
                            </div>
                        ))}
                  </>
              ) : (
                  <div className="flex items-center justify-center h-20 space-x-2">
                    <div
                        className="w-5 h-5 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600 dark:text-neutral-400 text-lg">
                         Loading recommendations
                  </span>
                  </div>
              )}
            </div>

          </Container>
        </ClientOnly>
      </div>
  );
};

export default Homepage;

