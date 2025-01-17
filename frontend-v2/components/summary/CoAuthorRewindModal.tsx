import React from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const CoAuthorRewindModal = ({ isOpen, onClose, rewindData }) => {
    const router = useRouter();

    if (!isOpen) return null;

    const formatName = (name) => {
        return name
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
    };

    const getMedal = (index) => {
        switch (index) {
            case 0:
                return "🥇";
            case 1:
                return "🥈";
            case 2:
                return "🥉";
            default:
                return null;
        }
    };

    const getBorderStyle = (index) => {
        switch (index) {
            case 0:
                return "border-yellow-400";
            case 1:
                return "border-gray-300";
            case 2:
                return "border-orange-600";
            default:
                return "border-gray-300";
        }
    };

    const handleNameClick = (name, profileLink) => {
        if (typeof profileLink !== "string") {
            console.error("Invalid profileLink:", profileLink);
            toast.error("Invalid profile link.");
            return;
        }
        const profileIdMatch = profileLink.match(/profile\/(\d+)$/);
        const profileId = profileIdMatch ? profileIdMatch[1] : "";

        if (!profileId) {
            console.error("Profile ID not found in the profileLink.");
            toast.error("Unable to extract profile ID from the profile link.");
            return;
        }
        const formattedName = name.trim().replace(/\s+/g, " ").toLowerCase();
        const searchParams = new URLSearchParams({
            name: formattedName,
            profileId: profileId,
        });
        toast.success("Redirecting to the summary page...");
        router.push(`/summary?${searchParams.toString()}`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white w-3/4 max-w-2xl p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                        Here&#39;s {formatName(rewindData["Author Name"])}&#39;s Co-Author
                        Rewind
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-700 text-lg font-bold"
                    >
                        &times;
                    </button>
                </div>
                <p className="mb-4">
                    {formatName(rewindData["Author Name"])} collaborated with{" "}
                    {rewindData["Total Co-Authors"]} co-authors.
                </p>
                <div className="overflow-y-auto max-h-96 grid grid-cols-1 gap-4">
                    {rewindData["Co-Author Summary"].map((coAuthor, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-lg shadow-md border-4 ${getBorderStyle(
                                index
                            )} flex items-center justify-between`}
                        >
                            <div className="flex items-center gap-4">
                                {getMedal(index) && (
                                    <span className="text-2xl">{getMedal(index)}</span>
                                )}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">
                                        {formatName(coAuthor.Name)}
                                    </h3>
                                    <p className="flex items-start space-x-1 text-gray-500 text-sm">
                                        <a
                                            href={coAuthor["Profile Link"]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-blue-600 break-words"
                                            style={{ wordBreak: "break-word", whiteSpace: "normal" }}
                                            onClick={(e) => e.stopPropagation()}>
                                            {coAuthor["Profile Link"]}
                                        </a>
                                    </p>
                                    <button
                                        onClick={() =>
                                            handleNameClick(coAuthor.Name, coAuthor["Profile Link"])
                                        }
                                        className="mt-1 text-blue-500 hover:underline text-sm"
                                    >
                                        View Profile
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">
                                Collaborations: {coAuthor["Collaboration Count"]}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CoAuthorRewindModal;
