"use client";

import { Book, Coins, DollarSign, Play, Lock, Loader2 } from "lucide-react";
import {
  AudiobookWithPurchase,
  PurchaseType,
  UserRole,
} from "@/types/audiobooks";
import { useAudiobookCheckout } from "@/hooks/audiobooks/useAudiobookCheckout";

interface AudiobookCardProps {
  audiobook: AudiobookWithPurchase;
  userPoints: number;
  userRole?: UserRole | null;
  onPurchase: (book: AudiobookWithPurchase, type: PurchaseType) => void;
  onClick: (book: AudiobookWithPurchase) => void;
}

export default function AudiobookCard({
  audiobook,
  userPoints,
  userRole,
  onPurchase,
  onClick,
}: AudiobookCardProps) {
  const {
    createCheckout,
    isLoading: isCheckoutLoading,
  } = useAudiobookCheckout();
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const canAffordWithPoints = userPoints >= audiobook.points_cost;
  const canAccess = audiobook.is_purchased || userRole === "admin" || audiobook.free_chapters > 0;
  const shouldShowPurchaseOptions = !audiobook.is_purchased && userRole !== "admin";

  return (
    <div
      className={`group rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
        canAccess
          ? "hover:shadow-xl cursor-pointer transform hover:-translate-y-1"
          : "opacity-90"
      }`}
      onClick={() => canAccess && onClick(audiobook)}
    >
      {/* Cover Image */}
      <div className="aspect-[3/4] bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center relative">
        {audiobook.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={audiobook.cover_image_url}
            alt={audiobook.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Book className="h-16 w-16 text-white" />
        )}

        {/* Top Left Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium">
            {audiobook.level_code}
          </span>
          <span className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(audiobook.duration_seconds)}
          </span>
        </div>

        <div className="absolute top-2 right-2 flex gap-1">
          {audiobook.is_purchased && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded font-medium">
              Owned
            </span>
          )}
          {canAccess && (
            <div className="bg-green-600 text-white p-1 rounded-full">
              <Play className="h-3 w-3" />
            </div>
          )}
        </div>

        {/* Bottom Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 mb-1">
            {audiobook.title}
          </h3>
          <p className="text-gray-200 text-xs mb-2">by {audiobook.author}</p>

          {/* Purchase Options */}
          {shouldShowPurchaseOptions && (
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPurchase(audiobook, "points");
                }}
                disabled={!canAffordWithPoints}
                className={`flex-1 text-xs font-semibold py-1 px-2 rounded transition-colors flex items-center justify-center gap-1 ${
                  canAffordWithPoints
                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Coins className="h-3 w-3" />
                {audiobook.points_cost}
                {!canAffordWithPoints && <Lock className="h-3 w-3" />}
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (audiobook.price_cents > 0) {
                    await createCheckout(audiobook.book_id);
                  } else {
                    onPurchase(audiobook, "money");
                  }
                }}
                disabled={isCheckoutLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold py-1 px-2 rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                {isCheckoutLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <DollarSign className="h-3 w-3" />
                    {formatPrice(audiobook.price_cents)}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Free Chapters Badge */}
        {audiobook.free_chapters > 0 && (
          <div className="absolute top-16 left-2">
            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded font-medium">
              {audiobook.free_chapters} Free
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
