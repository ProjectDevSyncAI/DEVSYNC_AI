import type { ReactNode } from "react";

import QueryProvider from "./QueryProvider";

interface AppProviderProps {
  children: ReactNode;
}

export default function AppProvider({
  children,
}: AppProviderProps) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
}