import axios, { isAxiosError } from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export const fetchPronunciationUnits = async () => {
  try {
    const response = await apiClient.get("/pronunciation/units");
    return response.data.units;
  } catch (error) {
    if (isAxiosError(error)) {
      const errorMessage =
        (error.response?.data as { error?: string })?.error ||
        (error.response?.data as { details?: string })?.details ||
        error.message;
      console.error("Error fetching pronunciation units:", errorMessage);
      throw new Error(errorMessage || "Failed to fetch units");
    }
    console.error("Unexpected error fetching pronunciation units:", error);
    throw new Error("An unexpected error occurred while fetching units.");
  }
};
