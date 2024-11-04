"use client";
import Button from "@/components/global/Button";
import Container from "@/components/global/Container";
import AuthorHeader from "@/components/summary/AuthorHeader";
import DetailsCard from "@/components/summary/DetailsCard";
import Loading from "@/components/summary/Loading";
import MarkdownContent from "@/components/summary/MarkdownContent";
import PublicationCard from "@/components/summary/PublicationCard";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

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
  "Orcid ID": string;
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

function Page() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [data, setData] = useState<AuthorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    const name = searchParams.get("name") || "";
    const profileId = parseInt(searchParams.get("profileId") || "0", 10);

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
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="pt-48 flex justify-center">
        <Container>
          <Loading />
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-48 flex justify-center">
        <Container>
          <p className="text-red-500">{error}</p>
        </Container>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pt-48 flex justify-center">
        <Container>
          <p className="text-red-500">No data available.</p>
        </Container>
      </div>
    );
  }

  return (
    <div className="pt-24">
      <Container>
        <div className="flex flex-grow bg-white shadow-2xl">
          <div className="w-[70%] p-4 flex flex-col">
            <div className="p-4">
              <AuthorHeader name={data.author_details.Name} />
              <DetailsCard
                bioTitle="Biography"
                bioContent={
                  data.author_details?.Biography?.Biography ||
                  "No biography available."
                } // Ensure it's an array
                eduTitle="Education History"
                eduContent={data.author_details?.["Education History"] || []} // Ensure it's an array
                empTitle="Employment History"
                empContent={data.author_details?.["Employment History"] || []} // Ensure it's an array
              />
            </div>
            <div className="p-6 ">
              <div className="flex-grow flex items-stretch bg-gray-100 rounded-lg">
                {/* Added bg color to see the expansion */}
                <div className="w-full">
                  <div className="mt-4 flex justify-center">
                    <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full font-medium">
                      AI-Generated Summary
                    </span>
                  </div>
                  {!data.summary && (
                    <div className="flex justify-center items-center min-h-80">
                      <p>No summary available.</p>
                    </div>
                  )}
                  <MarkdownContent content={data.summary} />
                </div>
              </div>
            </div>
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
            <PublicationCard publications={data.author_details.Publications} />
          </div>
        </div>
      </Container>
    </div>
  );
}

export default Page;
