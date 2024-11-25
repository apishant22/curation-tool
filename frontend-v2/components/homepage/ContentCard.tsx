"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface ContentCardProps {
    name: string;
    profileLink: string;
    summary?: string;
}

const ContentCard: React.FC<ContentCardProps> = ({ name, profileLink, summary }) => {
    const router = useRouter();

    const handleCardClick = async () => {
        const profileIdMatch = profileLink.match(/profile\/(\d+)$/);
        const profileId = profileIdMatch ? profileIdMatch[1] : "";
        const formattedName = name.trim().replace(/\s+/g, " ").toLowerCase();
        const searchParams = new URLSearchParams({
            name: formattedName,
            profileId: profileId,
        });

        if (!profileId) {
            toast.error("Invalid profile link.");
            return;
        }

        const apiUrl = `http://localhost:3002/query/${encodeURIComponent(name)}/${profileId}`;
        console.log("API URL:", apiUrl);

        try {
            toast.loading("Fetching author details...");
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`Failed to fetch author details. Status: ${response.status}`);
            }

            const data = await response.json();
            toast.dismiss();

            if (data.message) {
                toast.success(data.message);
            }

            router.push(`/summary?${searchParams.toString()}`);
        } catch (error) {
            console.error("Error fetching author details:", error);
            toast.error("Failed to fetch author details.");
        }
    };

    return (
        <div
            className="p-6 border rounded-lg shadow-sm hover:shadow-md transition dark:bg-zinc-800 cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-blue-600 dark:text-white hover:text-blue-800 dark:hover:text-neutral-500">
                    {name}
                </h2>

                {summary && (
                    <p className="text-gray-600 dark:text-neutral-400 text-sm">
                        {summary.length > 200 ? `${summary.substring(0, 200)}...` : summary}
                    </p>
                )}

                <div className="text-sm text-gray-500">
                    <p className="flex items-center space-x-1">
                        <span className="font-medium">ACM DL:</span>
                        <a
                            href={profileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {profileLink}
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ContentCard;
