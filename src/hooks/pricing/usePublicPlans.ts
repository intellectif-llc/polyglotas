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

export const usePublicPlans = () => {
  return useQuery<PricingPlan[]>({
    queryKey: ["public-plans"],
    queryFn: async () => {
      const response = await fetch("/api/pricing/plans");

      if (!response.ok) {
        throw new Error("Failed to fetch pricing plans");
      }

      return response.json();
    },
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};