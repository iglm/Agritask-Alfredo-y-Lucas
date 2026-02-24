"use client";

import { useUser } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// The login page is the only "public" route. All others require authentication.
const publicPath = "/login";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is determined
    }

    const isPublicPage = pathname === publicPath;

    // If the user is logged in and on the login page, redirect to home.
    if (user && isPublicPage) {
      router.push("/");
    }

    // If the user is not logged in and not on the login page, redirect to login.
    if (!user && !isPublicPage) {
      router.push(publicPath);
    }

  }, [user, isUserLoading, router, pathname]);

  // Show a loading screen while checking auth state or if the user is not logged in 
  // and not on the login page (to prevent content from flashing before redirect).
  if (isUserLoading || (!user && pathname !== publicPath)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Conectando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
