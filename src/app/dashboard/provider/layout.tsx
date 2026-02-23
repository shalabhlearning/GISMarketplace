// src/app/dashboard/provider/layout.tsx (Keep this - fixes nested loading/flicker)
import { ReactNode } from 'react';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}