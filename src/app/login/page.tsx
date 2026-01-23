
"use client";

import { AuthForm } from "@/components/auth/auth-form";
import { Tractor } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center mb-6">
            <div className="p-2.5 rounded-lg bg-primary mb-4">
                <Tractor className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-primary">AgriTask</h1>
            <p className="text-muted-foreground mt-1">Tu asistente agrícola inteligente</p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
