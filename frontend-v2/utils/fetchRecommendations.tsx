export const fetchRecommendations = async (authors: any[], maxRecommendations: number, maxResultsPerField: number) => {
    try {
        console.log("Sending payload:", {
            authors,
            max_recommendations: maxRecommendations,
            max_results_per_field: maxResultsPerField,
        });

        const response = await fetch("http://localhost:3002/recommendations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                authors,
                max_recommendations: Number(maxRecommendations),
                max_results_per_field: Number(maxResultsPerField),
            }),
        });

        if (!response.ok) {
            console.error("Error response:", await response.text());
            throw new Error(`Error fetching recommendations: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Response payload:", data);
        return data;
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        return null;
    }
};
