"use client";
import { Toast } from '@heroui/react';
import React from 'react';

// HeroUI v3 needs no app-wide provider; only the toast region is mounted once
export function HeroProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toast.Provider placement="top end" />
      {children}
    </>
  );
}
