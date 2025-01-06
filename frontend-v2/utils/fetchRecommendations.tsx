export const fetchRecommendations = async (
  authors: any[],
  maxRecommendations: number,
  maxResultsPerField: number
) => {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  try {
    console.log("Sending payload:", {
      authors,
      max_recommendations: maxRecommendations,
      max_results_per_field: maxResultsPerField,
    });

    const response = await fetch(`${BASE_URL}/recommendations`, {
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
