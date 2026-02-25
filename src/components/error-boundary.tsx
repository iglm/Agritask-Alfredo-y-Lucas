'use client';

import React from 'react';
import { Button } from './ui/button';
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

  handleReset = async () => {
    try {
      console.log("Attempting to repair application...");

      // 1. Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log("Service worker unregistered:", registration.scope);
        }
      }

      // 2. Clear localStorage (carefully)
      if (window.localStorage) {
        window.localStorage.clear();
        console.log("localStorage cleared.");
      }
      
      // 3. Force a hard reload from the server
      console.log("Forcing a hard reload...");
      window.location.reload(); 

    } catch (error) {
      console.error("Failed to repair application:", error);
      alert("No se pudo reparar la aplicación. Por favor, intente limpiar la caché de su navegador manualmente y recargue la página.");
    }
  };

  render() {
    if (this.state.hasError) {
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
            <h2 style={{ fontSize: '24px', fontWeight: '600', lineHeight: '2rem', margin: '0 0 8px 0' }}>
                Ocurrió un Error
            </h2>
            <p style={{ fontSize: '16px', lineHeight: '1.5rem', margin: '0 8px 24px 8px', color: 'hsl(var(--muted-foreground))' }}>
                La aplicación encontró un problema inesperado. Puedes intentar repararla para restaurar su estado inicial.
            </p>
            <Button onClick={this.handleReset} className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                Reparar Aplicación
            </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
