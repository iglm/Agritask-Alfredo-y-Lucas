'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    // Emit a generic client-side exception event
    errorEmitter.emit('client-exception', { error });
  }

  render() {
    if (this.state.hasError) {
      // This is a simple, non-interactive fallback UI.
      // In development, the Next.js overlay will appear over this.
      // In production, this prevents a white screen crash.
      return (
        <div style={{
            fontFamily: 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
            height: '100vh',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            padding: '1rem',
        }}>
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0' }}>
                Ha Ocurrido un Error
            </h2>
            <p style={{ fontSize: '16px', margin: '0 8px 24px 8px', color: 'hsl(var(--muted-foreground))' }}>
                La aplicación encontró un problema inesperado. Por favor, intenta recargar la página.
            </p>
        </div>
      );
    }

    return this.props.children;
  }
}
