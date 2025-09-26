import { useQuery } from "@tanstack/react-query";

interface BillingInfo {
  profile: {
    subscription_tier: string;
    stripe_customer_id: string | null;
  };
  customer: {
    id: string;
    email: string;
    name: string;
    created: number;
  } | null;
  subscriptions: Array<{
    id: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    trial_start_at?: string | null;
    trial_end_at?: string | null;
    metadata?: Record<string, unknown> | null;
    items: Array<{
      price: string;
      quantity: number;
    }>;
  }>;
}

export const useBillingInfo = () => {
  return useQuery<BillingInfo>({
    queryKey: ["billing-info"],
    queryFn: async () => {
      const response = await fetch("/api/billing/customer");

      if (!response.ok) {
        throw new Error("Failed to fetch billing information");
      }

      return response.json();
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
