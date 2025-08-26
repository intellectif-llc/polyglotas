import { useQuery } from "@tanstack/react-query";

interface Invoice {
  stripe_invoice_id: string;
  status: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  due_date: string | null;
  paid_at: string | null;
  invoice_pdf_url: string | null;
  hosted_invoice_url: string | null;
  billing_reason: string | null;
  issued_at: string | null;
  created_at: string;
}

export const useInvoiceHistory = () => {
  return useQuery<Invoice[]>({
    queryKey: ["invoice-history"],
    queryFn: async () => {
      const response = await fetch("/api/billing/invoices");

      if (!response.ok) {
        throw new Error("Failed to fetch invoice history");
      }

      return response.json();
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
