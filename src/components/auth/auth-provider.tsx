"use client";

import { useUser } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const protectedRoutes = ["/", "/lots", "/staff", "/tasks", "/calendar"];
const publicRoutes = ["/login"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is determined
    }

    const isProtectedRoute = protectedRoutes.includes(pathname);
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && isProtectedRoute) {
      router.push("/login");
    }

    if (user && isPublicRoute) {
      router.push("/");
    }
  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Conectando...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in and we are on a public page (like /login),
  // we don't want to render the main AppShell, just the children.
  if (!user && publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }
  
  // If user is logged in, or we are on a protected route (which will soon redirect),
  // render the children (which includes the AppShell).
  if (user || protectedRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // Fallback for any other case (shouldn't be reached often)
  return null;
}
