import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export const useNavigationState = (onNavigate?: () => void) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const handleNavigation = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    setPendingHref(href);
    
    startTransition(() => {
      router.push(href);
      onNavigate?.();
      // Reset pending state after a short delay to ensure smooth transition
      setTimeout(() => setPendingHref(null), 100);
    });
  };

  return {
    isPending,
    pendingHref,
    handleNavigation,
  };
};