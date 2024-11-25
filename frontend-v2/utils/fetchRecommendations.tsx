export const fetchRecommendations = async (authors: any[], maxRecommendations: number, maxResultsPerField: number) => {
    try {
        const response = await fetch("http://localhost:3002/recommendations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                authors,
                max_recommendations: maxRecommendations,
                max_results_per_field: maxResultsPerField,
            }),
        });

        if (!response.ok) {
            throw new Error(`Error fetching recommendations: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
};
