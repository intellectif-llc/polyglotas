"use client";

import React, { useState, useEffect } from "react";
import { Book, Download, ExternalLink, Coins, DollarSign, Calendar } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AudiobookPurchase {
  book_id: number;
  title: string;
  author: string;
  cover_image_url?: string;
  purchase_type: 'points' | 'money';
  amount_paid_cents?: number;
  points_spent?: number;
  purchased_at: string;
  invoice_pdf_url?: string;
  hosted_invoice_url?: string;
}

export default function PurchaseHistory() {
  const [purchases, setPurchases] = useState<AudiobookPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    loadPurchases();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPurchases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_user_audiobook_purchases', {
        p_profile_id: user.id
      });

      if (error) throw error;
      setPurchases(data || []);
    } catch (err) {
      console.error('Error loading purchases:', err);
      setError('Failed to load purchase history');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Purchase History
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          View your audiobook purchases and download receipts.
        </p>
      </div>

      {/* Purchase List */}
      {purchases.length === 0 ? (
        <div className="text-center py-12">
          <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No purchases yet
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Your audiobook purchases will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <div
              key={`${purchase.book_id}-${purchase.purchased_at}`}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {/* Book Cover */}
                  <div className="w-16 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    {purchase.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={purchase.cover_image_url}
                        alt={purchase.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Book className="h-8 w-8 text-white" />
                    )}
                  </div>

                  {/* Book Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {purchase.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      by {purchase.author}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(purchase.purchased_at)}
                      </div>
                      
                      <div className="flex items-center">
                        {purchase.purchase_type === 'points' ? (
                          <>
                            <Coins className="h-4 w-4 mr-1 text-yellow-500" />
                            {purchase.points_spent} points
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                            {formatPrice(purchase.amount_paid_cents || 0)}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {purchase.purchase_type === 'money' && (
                    <>
                      {purchase.invoice_pdf_url && (
                        <a
                          href={purchase.invoice_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Receipt
                        </a>
                      )}
                      
                      {purchase.hosted_invoice_url && (
                        <a
                          href={purchase.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Invoice
                        </a>
                      )}
                    </>
                  )}
                  
                  <a
                    href={`/learn/audiobooks/${purchase.book_id}`}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm text-sm font-medium transition-colors"
                  >
                    Listen Now
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}