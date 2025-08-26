import { useState } from "react";

export const useBillingPortal = () => {
  const [isLoading, setIsLoading] = useState(false);

  const openPortal = async (returnUrl?: string) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          return_url: returnUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to open billing portal");
      }

      const { url } = await response.json();

      // Redirect to Stripe billing portal
      window.location.href = url;
    } catch (error) {
      console.error("Error opening billing portal:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    openPortal,
    isLoading,
  };
};
