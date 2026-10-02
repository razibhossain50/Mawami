"use client";
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import React from 'react';

// HeroUI's package entry has no "use client" banner, so its providers must be
// rendered from a client component rather than a server layout.
export function HeroProviders({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <ToastProvider placement="top-right" />
      {children}
    </HeroUIProvider>
  );
}
