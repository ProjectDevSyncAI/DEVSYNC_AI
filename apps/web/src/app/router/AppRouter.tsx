import { BrowserRouter } from "react-router-dom";
import type { ReactNode } from "react";

interface AppRouterProps {
  children: ReactNode;
}

export default function AppRouter({
  children,
}: AppRouterProps) {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
}