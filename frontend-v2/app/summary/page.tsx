/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Buttons from "@/components/global/Button";
import Container from "@/components/global/Container";
import AuthorHeader from "@/components/summary/AuthorHeader";
import Loading from "@/components/summary/Loading";
import PublicationCard from "@/components/summary/PublicationCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import Tiptap from "@/components/tiptap/Tiptap";
import { fetchRecommendations } from "@/utils/fetchRecommendations";
import Search from "@/components/navbar/Search";

function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const name = searchParams.get("name") || "";
  const profileId = parseInt(searchParams.get("profileId") || "0", 10);

  const getStoredAuthors = () => {
    const storedAuthors = sessionStorage.getItem("authors");
    return storedAuthors ? JSON.parse(storedAuthors) : [];
  };

  const updateStoredAuthors = (newAuthor: {
    Name: string;
    "Fields of Study": string[];
  }) => {
    const currentAuthors = getStoredAuthors();
    const isAlreadyAdded = currentAuthors.some(
      (author: any) => author.Name === newAuthor.Name
    );
    if (!isAlreadyAdded) {
      const updatedAuthors = [...currentAuthors, newAuthor];
      sessionStorage.setItem("authors", JSON.stringify(updatedAuthors));
      return updatedAuthors;
    }
    return currentAuthors;
  };

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  const fetchAuthor = async (name: string, profileId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/query/${name}/${profileId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const fetchedData = await response.json();
      sessionStorage.setItem(
        `author_${name}_${profileId}`,
        JSON.stringify(fetchedData)
      );

      if (fetchedData?.author_details) {
        const { Name, "Fields of Study": fieldsOfStudy } =
          fetchedData.author_details;
        const updatedAuthors = updateStoredAuthors({
          Name,
          "Fields of Study": fieldsOfStudy,
        });

        const fetchAndStoreRecommendations = async (updatedAuthors: any[]) => {
          try {
            const recommendations = await fetchRecommendations(
              updatedAuthors,
              6,
              6
            );
            if (recommendations) {
              sessionStorage.setItem(
                "recommendations",
                JSON.stringify(recommendations)
              );
            }
          } catch (error) {
            console.error("Failed to fetch recommendations:", error);
          }
        };
        fetchAndStoreRecommendations(updatedAuthors);
      }

      return fetchedData;
    } catch (error) {
      console.error("Search failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedData = sessionStorage.getItem(`author_${name}_${profileId}`);
    if (cachedData) {
      setData(JSON.parse(cachedData));
      setLoading(false);
    } else {
      setLoading(true);
      fetchAuthor(name, profileId)
        .then((fetchedData) => setData(fetchedData))
        .catch((error) => {
          console.error("Querying author failed:", error);
          setError(
            "An error occurred while fetching data. Redirecting to the results page..."
          );
          setTimeout(() => {
            router.back();
          }, 2000);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [name, profileId]);

  if (loading) {
    return (
        <div className="pt-48 flex justify-center">
          <Container>
            <Loading profileLink={String(profileId)} />
          </Container>
        </div>
    );
  }

  if (error || !data) {
    return (
      <div className="pt-48 flex justify-center">
        <Container>
          <p className="text-red-500">{error}</p>
        </Container>
      </div>
    );
  }
  const cachedData = sessionStorage.getItem(`currentPagePath`);
  if (typeof window !== "undefined") {
    sessionStorage.setItem("lastPage", window.location.href);
  }

  if (!data?.author_details) {
    sessionStorage.removeItem(`author_${name}_${profileId}`);

    return (
      <div className="pt-48 flex justify-center">
        <Container>
          <div className="min-h-[50vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="ml-2">Error</AlertTitle>
                <AlertDescription className="mt-2">
                  We couldn&apos;t load the required data. This might be due to
                  a network issue or the content might be unavailable.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-4">
                <Buttons
                  onClick={() => {
                    if (cachedData) {
                      router.push(cachedData);
                    } else if (window.history.length > 1) {
                      router.back();
                    } else {
                      window.close();
                      window.location.href = "lastPage";
                    }
                  }}
                  label={"Go back to the last page"}
                  outline
                />
                <p className="text-sm text-gray-500 text-center">
                  If the problem persists, please try again later.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <Container>
        <Container>
          <div className="pt-20 pb-4 pr-4 flex justify-end">
            <div className="items-end">
              <Search />
            </div>
          </div>
        </Container>
        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="flex flex-grow shadow-2xl dark:bg-zinc-900">
              <div className="w-[70%] p-4 flex flex-col">
                <div className="p-2">
                  <AuthorHeader
                    name={data?.author_details?.Name || "No name available"}
                  />
                </div>

                <Tiptap name={name} summary={data?.summary} />
              </div>
              <div className="flex max-w-[600px] p-3 flex-col gap-4 mt-6 overflow-auto">
                <PublicationCard
                  publications={data?.author_details?.Publications || []}
                  name={data?.author_details?.Name}
                />
              </div>
            </div>
          </>
        )}
      </Container>
    </div>
  );
}

export default Page;
