"use client";
import Button from "@/components/global/Button";
import Container from "@/components/global/Container";
import AuthorHeader from "@/components/summary/AuthorHeader";
import Loading from "@/components/summary/Loading";
import PublicationCard from "@/components/summary/PublicationCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import Tiptap from "@/components/tiptap/Tiptap";

interface Biography {
  Biography: string;
}

interface EducationHistory {
  Department: string | null;
  "End Date": string;
  Institution: string;
  Role: string | null;
  "Start Date": string;
}

interface EmploymentHistory {
  Department: string | null;
  "End Date": string;
  Organization: string;
  Role: string;
  "Start Date": string;
}

interface CoAuthor {
  Name: string;
  "Profile Link": string;
}

interface Publication {
  Abstract: string;
  "Citation Count": number;
  "Co-Authors": CoAuthor[];
  DOI: string;
  "Publication Date": string;
  Title: string;
}

interface AuthorDetails {
  Biography: Biography;
  "Education History": EducationHistory[];
  "Employment History": EmploymentHistory[];
  Name: string;
  "Orcid ID": string;
  Publications: Publication[];
}

interface AuthorResponse {
  author_details: AuthorDetails;
  message: string;
  summary: string;
}

const testContent = `Lorem, ipsum dolor sit amet consectetur adipisicing elit. Iure expedita consequatur quam. Sint rem exercitationem sequi cupiditate blanditiis obcaecati consequatur quos, veritatis, harum libero vel quaerat natus numquam eligendi provident?`;

function Page() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [data, setData] = useState<AuthorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const name = searchParams.get("name") || "";
  const profileId = parseInt(searchParams.get("profileId") || "0", 10);

  const fetchAuthor = async (name: string, profileId: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3002/query/${name}/${profileId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      sessionStorage.setItem(
        `author_${name}_${profileId}`,
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
    // Check for cached results
    const cachedData = sessionStorage.getItem(`author_${name}_${profileId}`);
    if (cachedData) {
      setData(JSON.parse(cachedData));
      setLoading(false);
    } else {
      setLoading(true);
      fetchAuthor(name, profileId)
        .then((data) => setData(data))
        .catch((error) => {
          console.error("Querying author failed:", error);
          setError(
            "An error occurred while fetching data. Redirecting to the results page..."
          );
          setTimeout(() => {
            router.back(); // Redirect after a short delay
          }, 2000); // 2 seconds delay for user to see the message
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [searchParams, router, name, profileId]);

  if (loading) {
    return (
      <div className="pt-48 flex justify-center">
        <Container>
          <Loading />
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

  if (data.author_details == null) {
    const cachedData = sessionStorage.getItem(`currentPagePath`);
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
                  <p className="font-bold text-red-800">
                    Sometimes the database need a little bit of nudge before it
                    can start working..
                  </p>
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-4">
                <Button
                  onClick={() => {
                    // Check if cachedData exists
                    if (cachedData) {
                      router.push(cachedData); // Push to cached URL
                    } else {
                      console.warn("No cached URL found in sessionStorage");
                      router.back();
                    }
                  }}
                  label={"Go back to results page"}
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
    <div className="pt-24">
      <Container>
        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="flex flex-grow shadow-2xl dark:bg-zinc-900">
              <div className="w-[70%] p-4 flex flex-col">
                <div className="p-4">
                  <AuthorHeader
                    name={data?.author_details?.Name || "No name available"}
                  />
                </div>

                <Tiptap contentHere={testContent} />

                <div className="flex gap-4 justify-center p-2 mb-6">
                  <Button label={"Accept"} onClick={() => {}} />
                  <Button label={"Regenerate"} onClick={() => {}} />
                  <Button
                    label={"Back"}
                    onClick={() => {
                      router.back();
                    }}
                  />
                </div>
              </div>

              <div className="flex max-w-[600px] p-3 flex-col gap-4 mt-6 overflow-auto">
                <PublicationCard
                  publications={data?.author_details?.Publications || []}
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
