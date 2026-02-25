'use client';

import { useState, useEffect, useContext } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { FirebaseContext } from '@/firebase/provider';
import { collection, addDoc } from 'firebase/firestore';
import { SystemLog } from '@/lib/types';


/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It logs the error to Firestore for monitoring and then re-throws it to be
 * caught by the nearest Error Boundary.
 */
export function FirebaseErrorListener() {
  const [errorToThrow, setErrorToThrow] = useState<FirestorePermissionError | null>(null);
  const context = useContext(FirebaseContext);

  useEffect(() => {
    const handleError = async (error: FirestorePermissionError) => {
      // 1. Log the error silently to Firestore for SRE monitoring
      if (context?.firestore && context?.user) {
        try {
          const logData: Omit<SystemLog, 'id'> = {
            userId: context.user.uid,
            timestamp: new Date().toISOString(),
            errorMessage: error.message,
            errorStack: error.stack || '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            requestPath: error.request?.path,
            requestOperation: error.request?.method,
            requestData: error.request?.resource?.data
              ? JSON.stringify(error.request.resource.data)
              : undefined,
          };
          // We don't await this, we just fire-and-forget the log entry
          addDoc(collection(context.firestore, 'system_logs'), logData);
        } catch (logError) {
          // If logging fails, we don't want to swallow the original error.
          // Log the logging-error to the console for debugging.
          console.error("FirebaseErrorListener: Failed to write to system_logs:", logError);
        }
      }
      
      // 2. Set error in state to trigger a re-render, which will then throw.
      setErrorToThrow(error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [context]); // Rerun if context (and thus firestore/user instances) changes

  // On the re-render after an error is caught, throw it to the Error Boundary.
  if (errorToThrow) {
    throw errorToThrow;
  }

  // This component renders nothing.
  return null;
}
