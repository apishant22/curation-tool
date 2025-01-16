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
import { EditModeProvider } from "@/components/summary/EditModeContext";

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
      const fetchedData = await response.json();

      if (!response.ok) {
        throw new Error(
          fetchedData.message || `HTTP error! Status: ${response.status}`
        );
      }
      if (!fetchedData.author_details) {
        throw new Error("Author details not found");
      }
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
      const parsedData = JSON.parse(cachedData);
      if (!parsedData.author_details) {
        // Remove invalid cached data
        sessionStorage.removeItem(`author_${name}_${profileId}`);
        setError("Author details not found");
        setLoading(false);
        return;
      }
      setData(parsedData);
      setLoading(false);
    } else {
      setLoading(true);
      fetchAuthor(name, profileId)
        .then((fetchedData) => {
          if (!fetchedData.author_details) {
            throw new Error("Author details not found");
          }
          setData(fetchedData);
        })
        .catch((error) => {
          console.error("Querying author failed:", error);
          setError(error.message || "An error occurred while fetching data");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [name, profileId]);

  const ErrorDisplay = ({ error, onRetry, onBack }) => (
    <div className="pt-48 flex justify-center">
      <Container>
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="ml-2">Error</AlertTitle>
              <AlertDescription className="mt-2">
                {error ||
                  "We couldn't load the required data. This might be due to a network issue or the content might be unavailable."}
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-4">
              <Buttons onClick={onRetry} label="Retry" outline={false} />
              <Buttons
                onClick={onBack}
                label="Go back to the last page"
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
  const handleBack = () => {
    if (cachedData) {
      router.push(cachedData);
    } else if (window.history.length > 1) {
      router.back();
    } else {
      window.close();
      window.location.href = "lastPage";
    }
  };

  if (loading) {
    return (
      <div className="pt-48 flex justify-center">
        <Container>
          <Loading />
        </Container>
      </div>
    );
  }

  // Handle all error cases with the ErrorDisplay component
  if (error || !data || !data?.author_details) {
    sessionStorage.removeItem(`author_${name}_${profileId}`);
    return (
      <ErrorDisplay
        error={error || "Author details not found"}
        onRetry={() => window.location.reload()}
        onBack={handleBack}
      />
    );
  }

  const cachedData = sessionStorage.getItem(`currentPagePath`);
  if (typeof window !== "undefined") {
    sessionStorage.setItem("lastPage", window.location.href);
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
            <EditModeProvider>
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
            </EditModeProvider>
          </>
        )}
      </Container>
    </div>
  );
}

export default Page;
