"use client";

import { useState, useEffect, useRef } from "react";

export function ClientOnly({ children, fallback = null }: { 
  children: () => React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const renderRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    renderRef.current = true;
  }, []);

  if (!mounted || !renderRef.current) {
    return <>{fallback}</>;
  }

  return <>{children()}</>;
}