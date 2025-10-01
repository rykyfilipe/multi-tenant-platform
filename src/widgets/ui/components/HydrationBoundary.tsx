"use client";

import React, { useEffect, useState } from "react";

interface HydrationBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component to prevent hydration mismatches by ensuring
 * client-side rendering matches server-side rendering
 */
export const HydrationBoundary: React.FC<HydrationBoundaryProps> = ({ 
  children, 
  fallback = null 
}) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Set hydrated to true after the component mounts
    setIsHydrated(true);
  }, []);

  // During hydration, show fallback to prevent mismatches
  if (!isHydrated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Hook to check if component is hydrated
 */
export const useIsHydrated = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
};
