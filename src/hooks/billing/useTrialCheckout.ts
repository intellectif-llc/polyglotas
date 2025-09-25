import { useState } from "react";

export const useTrialCheckout = () => {
  const [isLoading, setIsLoading] = useState(false);

  const startTrial = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/billing/trial-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start trial");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Error starting trial:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    startTrial,
    isLoading,
  };
};