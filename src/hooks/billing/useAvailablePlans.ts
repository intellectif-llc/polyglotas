import { useQuery } from "@tanstack/react-query";

interface PricingPlan {
  id: number;
  stripe_price_id: string;
  unit_amount: number;
  currency: string;
  billing_interval: string;
  interval_count: number;
  product_name: string;
  tier_key: string;
}

export const useAvailablePlans = () => {
  return useQuery<PricingPlan[]>({
    queryKey: ["available-plans"],
    queryFn: async () => {
      const response = await fetch("/api/billing/plans");

      if (!response.ok) {
        throw new Error("Failed to fetch pricing plans");
      }

      return response.json();
    },
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
