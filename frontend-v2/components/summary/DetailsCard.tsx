"use client";

import { Accordion } from "flowbite-react";
import { BookOpen, Building2, Calendar, GraduationCap } from "lucide-react";
import React from "react";

interface Education {
  Department?: string | null;
  "End Date"?: string;
  Institution: string;
  Role?: string | null;
  "Start Date"?: string;
}

interface Employment {
  Department?: string | null;
  "End Date"?: string;
  Organization: string;
  Role: string;
  "Start Date"?: string;
}

interface DetailsCardProps {
  bioTitle: string;
  bioContent: string;
  eduTitle: string;
  eduContent: Education[] | string; // Can be an array or a string message
  empTitle: string;
  empContent: Employment[] | string; // Can be an array or a string message
}

const DetailsCard: React.FC<DetailsCardProps> = ({
  bioTitle,
  bioContent,
  eduTitle,
  eduContent,
  empTitle,
  empContent,
}) => {
  // Format biography content
  const formatBio = (bio: string) => {
    return bio && bio.length > 0 ? bio : "No biography available.";
  };

  return (
    <Accordion className="border border-gray-200 rounded-lg divide-y divide-gray-200">
      {/* Biography Section */}
      <Accordion.Panel>
        <Accordion.Title className="p-3 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            {bioTitle}
          </div>
        </Accordion.Title>
        <Accordion.Content className="px-4 py-3 text-gray-600 leading-relaxed">
          {formatBio(bioContent)}
        </Accordion.Content>
      </Accordion.Panel>

      {/* Education Section */}
      <Accordion.Panel>
        <Accordion.Title className="p-3 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            {eduTitle}
          </div>
        </Accordion.Title>
        <Accordion.Content className="px-4 py-3">
          {Array.isArray(eduContent) && eduContent.length > 0 ? (
            <div className="space-y-4">
              {eduContent.map((education, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {education.Institution}
                      </h4>
                      <p className="text-blue-600">{education.Role}</p>
                      {education.Department && (
                        <p className="text-gray-600 text-sm">
                          {education.Department}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {education["Start Date"] || "N/A"} -{" "}
                        {education["End Date"] || "Present"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">
              {typeof eduContent === "string"
                ? eduContent
                : "No education history available."}
            </p>
          )}
        </Accordion.Content>
      </Accordion.Panel>

      {/* Employment Section */}
      <Accordion.Panel>
        <Accordion.Title className="p-3 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            {empTitle}
          </div>
        </Accordion.Title>
        <Accordion.Content className="px-4 py-3">
          {Array.isArray(empContent) && empContent.length > 0 ? (
            <div className="space-y-6">
              {empContent
                .filter(
                  (job) =>
                    job.Role !== "Unknown" &&
                    job.Department !== "Unknown Department" &&
                    job.Organization !== "Unknown"
                )
                .sort(
                  (a, b) =>
                    new Date(b["Start Date"] || "").getTime() -
                    new Date(a["Start Date"] || "").getTime()
                )
                .map((job, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {job.Organization}
                        </h4>
                        <p className="text-blue-600">{job.Role}</p>
                        {job.Department && (
                          <p className="text-gray-600 text-sm">
                            {job.Department}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {job["Start Date"] || "N/A"} -{" "}
                          {job["End Date"] === "Unknown"
                            ? "Present"
                            : job["End Date"]}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              {typeof empContent === "string"
                ? empContent
                : "No employment history available."}
            </p>
          )}
        </Accordion.Content>
      </Accordion.Panel>
    </Accordion>
  );
};

export default DetailsCard;
