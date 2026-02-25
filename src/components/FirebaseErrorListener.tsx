'use client';

import { useState, useEffect, useContext } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { FirebaseContext } from '@/firebase/provider';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { SystemLog } from '@/lib/types';


/**
 * An invisible component that listens for globally emitted error events.
 * It logs errors to Firestore for monitoring and can trigger other side effects.
 */
export function FirebaseErrorListener() {
  const [errorToThrow, setErrorToThrow] = useState<FirestorePermissionError | null>(null);
  const context = useContext(FirebaseContext);

  useEffect(() => {
    const handleError = async (error: Error, isClientException: boolean) => {
        if (!context?.firestore || !context?.user) return; // Cannot log if not authenticated

        const isPermissionError = error instanceof FirestorePermissionError;
        
        try {
            const fingerprint = `${error.name}:${error.message.split('\\n')[0]}`;
            const now = new Date().toISOString();
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const logsCollection = collection(context.firestore, 'system_logs');
            const q = query(
                logsCollection,
                where('userId', '==', context.user.uid),
                where('fingerprint', '==', fingerprint),
                where('lastOccurrence', '>=', twentyFourHoursAgo)
            );
            
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Update existing log
                const existingLogDoc = querySnapshot.docs[0];
                const logRef = doc(context.firestore, 'system_logs', existingLogDoc.id);
                const currentOccurrences = existingLogDoc.data().occurrences || 1;
                await updateDoc(logRef, {
                    occurrences: currentOccurrences + 1,
                    lastOccurrence: now,
                });
            } else {
                // Create new log document
                const newLogData: Omit<SystemLog, 'id'> = {
                    userId: context.user.uid,
                    timestamp: now,
                    lastOccurrence: now,
                    severity: 'HIGH', // All caught errors are considered high severity for now
                    fingerprint: fingerprint,
                    occurrences: 1,
                    errorDetail: {
                        message: error.message,
                        stack: error.stack,
                    },
                    contextSnapshot: {
                        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
                        requestPath: isPermissionError ? (error as FirestorePermissionError).request?.path : undefined,
                        requestOperation: isPermissionError ? (error as FirestorePermissionError).request?.method : undefined,
                        requestData: (isPermissionError && (error as FirestorePermissionError).request?.resource?.data)
                            ? JSON.stringify((error as FirestorePermissionError).request.resource.data)
                            : undefined,
                    },
                    resolution: {
                        status: 'pending',
                        aiDiagnosis: undefined,
                        rescueTriggered: isClientException,
                    },
                };
                await addDoc(logsCollection, newLogData);
            }
        } catch (logError) {
            console.error("FirebaseErrorListener: Failed to write to system_logs:", logError);
        }
    };
    
    // Handler for Firestore permission errors (silent, dev-facing)
    const handlePermissionError = (error: FirestorePermissionError) => {
        handleError(error, false);
        setErrorToThrow(error); // Re-throw to show dev overlay
    };

    // Handler for general client-side exceptions (user-facing)
    const handleClientException = ({ error }: { error: Error }) => {
        handleError(error, true);
        // Don't re-throw; the ErrorBoundary is already handling the UI fallback.
    };

    errorEmitter.on('permission-error', handlePermissionError);
    errorEmitter.on('client-exception', handleClientException);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
      errorEmitter.off('client-exception', handleClientException);
    };
  }, [context]);

  // On the re-render after a permission error is caught, throw it to the Error Boundary.
  // This is primarily for the developer experience in dev mode.
  if (errorToThrow) {
    throw errorToThrow;
  }

  // This component renders nothing.
  return null;
}
