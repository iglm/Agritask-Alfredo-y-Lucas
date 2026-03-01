'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[]; // Returns an array, never null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
    collectionGroup?: string;
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries gracefully by returning an empty array.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @param {object} options - Optional settings for the hook.
 * @param {number} options.retryCount - Number of times to retry on network-like errors. Defaults to 3.
 * @param {number} options.retryDelay - Delay between retries in ms. Defaults to 1000.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error. Data is always an array.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
    options: { retryCount?: number; retryDelay?: number } = {}
): UseCollectionResult<T> {
  const { retryCount = 3, retryDelay = 1000 } = options;
  type ResultItemType = WithId<T>;
  
  const [data, setData] = useState<ResultItemType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading true
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData([]); // Return empty array if no query (e.g., user not logged in)
      setIsLoading(false);
      setError(null);
      return;
    }

    let retryAttempt = 0;
    let unsubscribe: (() => void) | null = null;

    const subscribe = () => {
        setIsLoading(true);
        setError(null);

        unsubscribe = onSnapshot(
          memoizedTargetRefOrQuery,
          (snapshot: QuerySnapshot<DocumentData>) => {
            const results: ResultItemType[] = [];
            for (const doc of snapshot.docs) {
              results.push({ ...(doc.data() as T), id: doc.id });
            }
            setData(results);
            setError(null);
            setIsLoading(false);
            retryAttempt = 0; // Reset on success
          },
          (err: FirestoreError) => {
            console.error("useCollection Firestore error:", err);

            // No retry for permission errors, they are a config issue.
            if (err.code === 'permission-denied') {
                let path: string;
                const internalQuery = memoizedTargetRefOrQuery as unknown as InternalQuery;
                if (memoizedTargetRefOrQuery.type === 'collection') {
                    path = (memoizedTargetRefOrQuery as CollectionReference).path;
                } else if (internalQuery._query?.collectionGroup) {
                    path = internalQuery._query.collectionGroup;
                } else {
                    path = internalQuery._query.path.canonicalString();
                }
                const contextualError = new FirestorePermissionError({ operation: 'list', path });
                setError(contextualError);
                setData([]);
                setIsLoading(false);
                errorEmitter.emit('permission-error', contextualError);
                return;
            }

            // No retry for index errors, they are a config issue.
            if (err.code === 'failed-precondition') {
                const indexError = new Error(`Índice de Firestore requerido. ${err.message}. Revisa la consola de Firebase para crearlo.`);
                setError(indexError);
                setData([]);
                setIsLoading(false);
                return;
            }
            
            // Retry for other errors (likely network-related)
            if (retryAttempt < retryCount) {
              retryAttempt++;
              setTimeout(subscribe, retryDelay * retryAttempt);
            } else {
              setError(err);
              setData([]);
              setIsLoading(false);
            }
          }
        );
    }
    
    subscribe();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [memoizedTargetRefOrQuery, retryCount, retryDelay]);

  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(memoizedTargetRefOrQuery + ' was not properly memoized using useMemoFirebase');
  }
  return { data, isLoading, error };
}
