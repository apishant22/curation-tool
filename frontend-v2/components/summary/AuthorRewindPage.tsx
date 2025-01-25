import React, { useState, useEffect } from "react";
import { IoMdArrowBack } from "react-icons/io";
import { useRouter } from "next/navigation";

const AuthorHighlight = ({ authorDetails }) => {
  const [rewindData, setRewindData] = useState(null);
  const [error, setError] = useState(null);

  const handleSummaryView = () => {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete("view");
    router.push(`${window.location.pathname}?${searchParams.toString()}`);
  };

  const {
    Name,
    Publications = [],
    "Fields of Study": fieldsOfStudy = [],
  } = authorDetails || {};
  const router = useRouter();
  const formatName = (name) =>
    name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");

  const numberOfPublications = Publications.length;
  const totalCitations = Publications.reduce(
    (sum, pub) => sum + (pub["Citation Count"] || 0),
    0
  );
  const publicationDates = Publications.map((pub) => pub["Publication Date"])
    .filter((date) => date !== "None")
    .sort();
  const firstPublicationYear = (publicationDates[0] || "Unknown").split("-")[0];
  const lastPublicationYear = (
    publicationDates[publicationDates.length - 1] || "Unknown"
  ).split("-")[0];

  const topPublications = [...Publications]
    .sort((a, b) => (b["Citation Count"] || 0) - (a["Citation Count"] || 0))
    .slice(0, 3);

  const fetchCoAuthorDetails = async (name) => {
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
      const response = await fetch(`${BASE_URL}/coauthor_rewind/${name}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! Status: ${response.status}`
        );
      }
      const data = await response.json();
      setRewindData(data);
    } catch (error) {
      console.error("Failed to fetch co-author rewind data:", error);
      setError(error.message);
    }
  };

  useEffect(() => {
    if (Name && !rewindData) {
      fetchCoAuthorDetails(Name);
    }
  }, [Name, rewindData]);

  const getMedal = (index) => ["🥇", "🥈", "🥉"][index] || null;
  const getBorderStyle = (index) =>
    ["border-yellow-400", "border-gray-300", "border-orange-700"][index] ||
    "border-gray-300";

  return (
      <div className="bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-black dark:text-white min-h-screen flex justify-center items-center p-10 pt-32">
        <div className="max-w-8xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-800 p-12">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
                onClick={handleSummaryView}
                className="p-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-full shadow">
              <IoMdArrowBack size={24} className="dark:text-white" />
            </button>
            <h1 className="text-4xl font-bold text-center flex-1 dark:text-white">
              {formatName(Name)}&#39;s Overview
            </h1>
          </div>

          {/* Metrics Section */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow text-center">
              <h2 className="text-lg font-semibold dark:text-gray-300">
                Publications
              </h2>
              <p className="text-2xl font-bold dark:text-gray-100">
                {numberOfPublications}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow text-center">
              <h2 className="text-lg font-semibold dark:text-gray-300">
                Total Citations
              </h2>
              <p className="text-2xl font-bold dark:text-gray-100">
                {totalCitations}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow text-center">
              <h2 className="text-lg font-semibold dark:text-gray-300">
                Publication Range
              </h2>
              <p className="text-2xl font-bold dark:text-gray-100">
                {firstPublicationYear} - {lastPublicationYear}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow text-center">
              <h2 className="text-lg font-semibold dark:text-gray-300">
                Fields of Contribution
              </h2>
              <p className="text-2xl font-bold dark:text-gray-100">
                {fieldsOfStudy.length}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-2 gap-8">
            {/* Top Collaborators */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 dark:text-gray-100">
                Top Collaborators
              </h2>
              {error ? (
                  <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
              ) : (
                  <div className="space-y-4">
                    {rewindData &&
                        rewindData["Co-Author Summary"]
                            .slice(0, 3)
                            .map((coAuthor, index) => (
                                <div
                                    key={index}
                                    className={`p-4 rounded-lg shadow-md border-4 ${getBorderStyle(
                                        index
                                    )} flex items-center justify-between`}>
                                  <div className="flex items-center gap-4">
                                    {getMedal(index) && (
                                        <span className="text-2xl dark:text-white">
                          {getMedal(index)}
                        </span>
                                    )}
                                    <div>
                                      <h3 className="text-lg font-bold dark:text-gray-200">
                                        {formatName(coAuthor.Name)}
                                      </h3>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Collaborations: {coAuthor["Collaboration Count"]}
                                      </p>
                                      <a
                                          href={coAuthor["Profile Link"]}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-500 hover:underline dark:text-blue-400">
                                        View ACM-DL Profile
                                      </a>
                                    </div>
                                  </div>
                                </div>
                            ))}
                  </div>
              )}
            </div>

            {/* Top Publications */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 dark:text-gray-100">
                Top Publications
              </h2>
              <div className="space-y-4">
                {topPublications.map((pub, index) => (
                    <div
                        key={index}
                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl shadow hover:shadow-md transition">
                      <h3 className="font-semibold text-lg dark:text-gray-200">
                        {pub.Title || "Untitled"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Citations: {pub["Citation Count"] || 0} | Date:{" "}
                        {pub["Publication Date"] || "Unknown"}
                      </p>
                      <a
                          href={`https://doi.org/${pub.DOI}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline dark:text-blue-400">
                        View Publication
                      </a>
                    </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fields of Study */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 dark:text-gray-100">
              Fields of Study
            </h2>
            <ul className="grid grid-cols-3 gap-4">
              {fieldsOfStudy.map((field, index) => (
                  <li
                      key={index}
                      className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow text-center font-medium text-gray-800 dark:text-gray-200 hover:shadow-md transition">
                    {field}
                  </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
  );
};

export default AuthorHighlight;
