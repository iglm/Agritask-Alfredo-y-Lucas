"use client";

import { useUser } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// The login page is the only "public" route that a logged-in user shouldn't see.
const publicRoutes = ["/login"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is determined
    }

    const isPublicRoute = publicRoutes.includes(pathname);

    // If a logged-in user tries to access the login page, redirect them to the dashboard.
    if (user && isPublicRoute) {
      router.push("/");
    }
    
    // Unauthenticated users can now access any page, so no redirect logic is needed here.
    // The DataProvider will handle serving local or remote data.

  }, [user, isUserLoading, router, pathname]);

  // The loading screen is still useful during the initial auth check.
  if (isUserLoading && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Conectando...</p>
        </div>
      </div>
    );
  }

  // The AppShell is now always rendered, and DataProvider decides what to show.
  return <>{children}</>;
}
